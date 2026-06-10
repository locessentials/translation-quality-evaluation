"""
split_label_studio_export.py

Splits a Label Studio JSON export into one file per task,
named after the source file_upload field.

Optionally filters annotations to a specific set of annotators
before writing, so only the desired annotators' work appears in
the output files.

Usage:
    python split_label_studio_export.py <input_file.json> [output_dir] [annotator_ids]

    output_dir      defaults to the same directory as the input file.
    annotator_ids   optional comma-separated list of annotator IDs to include.
                    Omit (or pass "all") to include all annotators.

Examples:
    python split_label_studio_export.py export.json ./data
    python split_label_studio_export.py export.json ./data 1,110
"""

import json
import os
import sys
import re


def sanitize_filename(name: str) -> str:
    """Strip any leading hash prefix (e.g. '4832f027-') and clean the name."""
    # Remove UUID-like prefixes (8 hex chars + dash)
    name = re.sub(r'^[0-9a-f]{8}-', '', name)
    # Replace any remaining characters that are unsafe in filenames
    name = re.sub(r'[^\w.\-]', '_', name)
    return name


def split_export(input_path: str, output_dir: str, annotator_ids: set = None) -> None:
    with open(input_path, encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError("Expected a JSON array at the top level.")

    os.makedirs(output_dir, exist_ok=True)

    for item in data:
        # ── Annotator filter ──────────────────────────────────────────────
        if annotator_ids is not None:
            item = dict(item)  # shallow copy — don't mutate the original
            item["annotations"] = [
                a for a in item.get("annotations", [])
                if a.get("completed_by") in annotator_ids
            ]
            if not item["annotations"]:
                print(f"  Skipped:  task {item.get('id')} (no annotations for specified annotators)")
                continue

        file_upload = item.get("file_upload", f"task_{item.get('id', 'unknown')}.json")
        out_name = sanitize_filename(file_upload)

        # Ensure the output file has a .json extension
        if not out_name.endswith(".json"):
            out_name += ".json"

        out_path = os.path.join(output_dir, out_name)

        # Wrap in a list to preserve Label Studio's array structure
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump([item], f, ensure_ascii=False, indent=2)

        print(f"  Written: {out_path}  ({len(item['annotations'])} annotation(s))")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    input_file = sys.argv[1]
    output_directory = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(input_file) or "."

    annotator_ids = None
    if len(sys.argv) > 3 and sys.argv[3].lower() != "all":
        try:
            annotator_ids = set(int(x.strip()) for x in sys.argv[3].split(","))
        except ValueError:
            print(f"Error: annotator_ids must be a comma-separated list of integers (got: {sys.argv[3]})")
            sys.exit(1)

    print(f"Input:      {input_file}")
    print(f"Output dir: {output_directory}")
    if annotator_ids is not None:
        print(f"Annotators: {sorted(annotator_ids)}")
    else:
        print(f"Annotators: all")
    print()

    split_export(input_file, output_directory, annotator_ids)
    print("\nDone.")
