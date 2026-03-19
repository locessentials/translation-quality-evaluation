import json
import re
from pathlib import Path
import sys

def extract_base_name_from_filename(source_file):
    """
    Extract base name from filename, removing file extension
    """
    if not source_file:
        return None
    
    # Get the base name without extension
    base_name = Path(source_file).stem
    
    # Handle cases where there might be multiple underscores or hyphens
    # This preserves the original filename structure while removing extension
    return base_name

def repair_label_studio_export_encoding(text):
    """Fix Label Studio JSON export encoding corruption"""
    if not isinstance(text, str):
        return text
    try:
        # This specifically fixes the Label Studio export encoding issue
        return text.encode('latin-1').decode('utf-8')
    except (UnicodeDecodeError, UnicodeEncodeError):
        return text

def parse_label_studio_export(input_file, output_suffix="-evaluation"):
    """
    Parse Label Studio export and create individual evaluation files
    
    Args:
        input_file (str): Path to the Label Studio JSON export file
        output_suffix (str): Suffix to append to output filenames (default: "-evaluation")
    
    Returns:
        int: Number of files created
    """
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON format in {input_file}: {e}")
        return 0
    except FileNotFoundError:
        print(f"Error: File '{input_file}' not found!")
        return 0
    
    files_created = 0
    
    for task in data:
        # Skip if no annotations
        if not task.get('annotations'):
            print(f"Skipping task {task.get('id', 'unknown')} - no annotations found")
            continue
            
        # Get source file info
        meta = task.get('meta', {})
        source_file = meta.get('source_file', f"task_{task.get('id', 'unknown')}")
        
        # Skip answer key files (common pattern in evaluation workflows)
        if any(pattern in source_file.lower() for pattern in ['answer-key', 'answer_key', 'answerkey']):
            print(f"Skipping answer key file: {source_file}")
            continue
        
        # Extract base name for output file
        base_name = extract_base_name_from_filename(source_file)
        if not base_name:
            print(f"Could not extract base name from: {source_file}")
            continue
        
        # Get the annotation data (using first annotation if multiple exist)
        annotation = task['annotations'][0] if task['annotations'] else {}
        
        # Structure the output data
        evaluation_data = {
            "file_name": source_file,
            "base_name": base_name,
            "task_id": task.get('id'),
            "annotation_data": {
                "result": annotation.get('result', []),
                "created_at": annotation.get('created_at'),
                "updated_at": annotation.get('updated_at'),
                "lead_time": annotation.get('lead_time'),
                "result_count": annotation.get('result_count'),
                "task_id": annotation.get('task')
            },
            "source_text": task.get('data', {}).get('text', ''),
            "data": task.get('data', {}),  # Include all data fields
            "meta_info": meta,
            "created_at": task.get('created_at'),
            "updated_at": task.get('updated_at')
        }
        
        # Create output filename
        output_filename = f"{base_name}{output_suffix}.json"
        
        # Write individual file with pretty formatting
        try:
            with open(output_filename, 'w', encoding='utf-8') as f:
                json.dump(evaluation_data, f, ensure_ascii=False, indent=2, sort_keys=True)
            
            files_created += 1
            print(f"Created: {output_filename}")
            
        except Exception as e:
            print(f"Error writing file {output_filename}: {e}")
            continue
    
    return files_created

def find_json_files():
    """
    Find JSON files in the current directory, excluding evaluation files
    """
    json_files = []
    for file_path in Path('.').glob('*.json'):
        # Skip files that look like they're already evaluation outputs
        if not any(suffix in file_path.stem for suffix in ['-evaluation', '_evaluation', '-processed', '_processed']):
            json_files.append(file_path)
    return json_files

def main():
    """
    Main function to run the Label Studio export parser
    """
    input_file = None
    output_suffix = "-evaluation"
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        first_arg = sys.argv[1]
        # If first argument starts with '-', it's a suffix
        if first_arg.startswith('-'):
            output_suffix = first_arg
        else:
            # Otherwise it's a filename
            input_file = first_arg
            # Check if second argument is a suffix
            if len(sys.argv) > 2:
                output_suffix = sys.argv[2]
    
    # If no input file specified, try to find JSON files automatically
    if not input_file:
        json_files = find_json_files()
        
        if len(json_files) == 0:
            print("❌ No JSON files found in current directory.")
            print("\nUsage:")
            print(f"  python {Path(__file__).name}                    # Auto-detect JSON file")
            print(f"  python {Path(__file__).name} -custom-suffix     # Auto-detect with custom suffix")
            print(f"  python {Path(__file__).name} filename.json      # Specify file")
            print(f"  python {Path(__file__).name} filename.json -suffix  # Specify file and suffix")
            return
        elif len(json_files) == 1:
            input_file = str(json_files[0])
            print(f"📁 Auto-detected JSON file: {input_file}")
        else:
            print(f"📁 Found {len(json_files)} JSON files:")
            for i, file_path in enumerate(json_files, 1):
                print(f"  {i}. {file_path.name}")
            
            try:
                choice = input(f"\nSelect file (1-{len(json_files)}) or press Enter for all: ").strip()
                if choice == "":
                    # Process all files
                    total_files = 0
                    for json_file in json_files:
                        print(f"\n{'='*50}")
                        print(f"Processing: {json_file}")
                        print(f"Output suffix: {output_suffix}")
                        print("-" * 50)
                        files_created = parse_label_studio_export(str(json_file), output_suffix)
                        total_files += files_created
                    
                    print("=" * 50)
                    print(f"✅ Total files processed: {total_files}")
                    return
                else:
                    choice_idx = int(choice) - 1
                    if 0 <= choice_idx < len(json_files):
                        input_file = str(json_files[choice_idx])
                    else:
                        print("❌ Invalid selection!")
                        return
            except (ValueError, KeyboardInterrupt):
                print("\n❌ Invalid input or cancelled.")
                return
    
    # Validate input file exists
    if not Path(input_file).exists():
        print(f"❌ Error: Input file '{input_file}' not found!")
        return
    
    print(f"Processing Label Studio export: {input_file}")
    print(f"Output suffix: {output_suffix}")
    print("-" * 50)
    
    try:
        files_created = parse_label_studio_export(input_file, output_suffix)
        
        print("-" * 50)
        if files_created > 0:
            print(f"✅ Successfully processed {files_created} files.")
            print(f"Individual evaluation JSON files have been created with '{output_suffix}' suffix.")
        else:
            print("❌ No files were created. Please check the input data and try again.")
            
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)