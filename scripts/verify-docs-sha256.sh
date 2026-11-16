#!/usr/bin/env bash
set -euo pipefail

# Vérification / génération du manifeste SHA-256 des pièces PDF dans assets/docs/
# Ne modifie jamais assets/docs/ (lecture seule).

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST="${ROOT_DIR}/data/docs-sha256.txt"
MODE="${1:---check}"

hash_cmd() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$@"
  else
    shasum -a 256 "$@"
  fi
}

cd "${ROOT_DIR}"

if [[ "${MODE}" == "--generate" ]]; then
  {
    echo "# Manifeste SHA-256 des pièces officielles (lecture seule sur assets/docs/)"
    echo "# Régénéré par scripts/verify-docs-sha256.sh --generate"
    find assets/docs -type f -name "*.pdf" | LC_ALL=C sort | while IFS= read -r f; do
      hash_cmd "${f}"
    done
  } > "${MANIFEST}"
  echo "Manifeste généré : ${MANIFEST}"
  exit 0
fi

if [[ ! -f "${MANIFEST}" ]]; then
  echo "Erreur : manifeste absent (${MANIFEST}). Exécutez --generate." >&2
  exit 1
fi

expected_count=0
verified_count=0
failed=0

while IFS= read -r line; do
  [[ -z "${line}" || "${line}" == \#* ]] && continue
  expected_hash="${line%% *}"
  file_path="${line#*  }"
  expected_count=$((expected_count + 1))

  if [[ ! -f "${file_path}" ]]; then
    echo "MANQUANT : ${file_path}" >&2
    failed=1
    continue
  fi

  actual_line="$(hash_cmd "${file_path}")"
  actual_hash="${actual_line%% *}"
  if [[ "${actual_hash}" != "${expected_hash}" ]]; then
    echo "ALTÉRÉ : ${file_path} (attendu ${expected_hash}, obtenu ${actual_hash})" >&2
    failed=1
  else
    verified_count=$((verified_count + 1))
  fi
done < "${MANIFEST}"

if [[ "${failed}" -ne 0 ]]; then
  exit 1
fi

echo "SHA-256 OK : ${verified_count}/${expected_count} pièces PDF vérifiées dans assets/docs/."
