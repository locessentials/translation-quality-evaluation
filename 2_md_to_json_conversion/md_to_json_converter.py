#!/usr/bin/env python3
"""
MD to JSON Converter for Label Studio
Converts markdown (.md) files to Label Studio JSON format for annotation projects

This script automatically discovers all .md files in the current directory
and converts them to JSON format suitable for import into Label Studio.
"""

import os
import re
import json
import glob
from pathlib import Path
from datetime import datetime

class MDToJSONConverter:
    def __init__(self, output_folder="../3_label_studio_input"):
        self.current_dir = Path.cwd()
        self.output_dir = Path(output_folder)
        
        # Create output directory if it doesn't exist
        self.output_dir.mkdir(exist_ok=True)
        
        # Auto-discover .md files in current directory
        self.md_files = self.discover_md_files()
        
    def discover_md_files(self):
        """Automatically discover all .md files in the current directory"""
        md_pattern = self.current_dir / "*.md"
        md_files = list(glob.glob(str(md_pattern)))
        
        # Convert to just filenames (not full paths)
        md_files = [Path(f).name for f in md_files]
        
        return sorted(md_files)  # Sort for consistent processing order
        
    def remove_yaml_frontmatter(self, content):
        """Remove YAML frontmatter from markdown content (only at the beginning)"""
        # Only remove YAML frontmatter if it's at the very start of the document
        if content.strip().startswith('---'):
            lines = content.split('\n')
            if len(lines) > 0 and lines[0].strip() == '---':
                # Look for proper YAML frontmatter (key: value pairs)
                yaml_content = []
                closing_line = None
                
                # Check lines between opening and closing ---
                for i, line in enumerate(lines[1:], 1):
                    if line.strip() == '---':
                        closing_line = i
                        break
                    yaml_content.append(line.strip())
                
                # Only remove if we found a closing --- and content looks like YAML
                if closing_line is not None:
                    # Simple check: YAML typically has key: value pairs or is empty
                    looks_like_yaml = True
                    for yaml_line in yaml_content:
                        if yaml_line and ':' not in yaml_line and not yaml_line.startswith('#'):
                            looks_like_yaml = False
                            break
                    
                    if looks_like_yaml:
                        # Remove everything up to and including the closing line
                        remaining_content = '\n'.join(lines[closing_line+1:])
                        return remaining_content.strip()
        
        # If no valid YAML frontmatter found, return original content
        return content.strip()
    
    def extract_text_name(self, filename):
        """Extract text name from filename (remove .md extension)"""
        return Path(filename).stem
    
    def clean_text_for_labeling(self, text):
        """Clean text for Label Studio - preserve structure but normalize"""
        # Remove excessive whitespace but preserve structure
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            # Keep empty lines for structure
            if line.strip() == '':
                cleaned_lines.append('')
            else:
                # Clean but preserve formatting
                cleaned_lines.append(line.strip())
        
        # Join and remove excessive empty lines
        text = '\n'.join(cleaned_lines)
        # Replace multiple consecutive empty lines with max 2
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        return text
    
    def create_json_from_md(self, filename):
        """Create JSON for individual markdown file"""
        file_path = self.current_dir / filename
        
        if not file_path.exists():
            print(f"❌ File not found: {file_path}")
            return False
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Remove YAML frontmatter
            clean_content = self.remove_yaml_frontmatter(content)
            clean_content = self.clean_text_for_labeling(clean_content)
            
            # Extract text name
            text_name = self.extract_text_name(filename)
            
            # Create Label Studio JSON structure
            json_data = {
                "data": {
                    "text": clean_content
                },
                "annotations": [],
                "predictions": [],
                "id": 1,
                "meta": {
                    "source_file": filename,
                    "text_name": text_name,
                    "type": "text_for_annotation",
                    "created_date": datetime.now().isoformat(),
                    "converter": "md_to_json_converter"
                }
            }
            
            # Save JSON file (format: filename.json)
            output_filename = f"{text_name}.json"
            output_file = self.output_dir / output_filename
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(json_data, f, ensure_ascii=False, indent=2)
            
            print(f"✅ JSON created: {output_file}")
            print(f"   Source: {filename}")
            print(f"   Text length: {len(clean_content)} characters")
            return True
            
        except Exception as e:
            print(f"❌ Error creating JSON for {filename}: {e}")
            return False
    
    def batch_convert(self):
        """Convert all discovered markdown files to JSON"""
        print("🚀 MD to JSON Converter for Label Studio")
        print("=" * 50)
        
        if not self.md_files:
            print("❌ No .md files found in current directory!")
            print("📋 Please ensure you have .md files in the same folder as this script.")
            return 0, 0
        
        print(f"📁 Current directory: {self.current_dir}")
        print(f"📁 Output directory: {self.output_dir}")
        print(f"📄 Found {len(self.md_files)} .md files:")
        for file in self.md_files:
            print(f"   - {file}")
        print()
        
        # Process all files
        print(f"🔄 Processing {len(self.md_files)} markdown files...")
        successful_conversions = 0
        
        for filename in self.md_files:
            print(f"\n📝 Processing: {filename}")
            if self.create_json_from_md(filename):
                successful_conversions += 1
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 CONVERSION SUMMARY")
        print("=" * 50)
        print(f"Files processed: {successful_conversions}/{len(self.md_files)} successful")
        
        if successful_conversions == len(self.md_files):
            print("\n🎉 All files converted successfully!")
            print(f"📁 Output directory: {self.output_dir}")
            print("\n📋 Next steps:")
            print("1. Import .json files into Label Studio")
            print("2. Create your annotation project")
            print("3. Label your texts as needed")
            print("4. Export labeled data for analysis")
        else:
            print("\n⚠️ Some files failed to convert. Check error messages above.")
        
        return successful_conversions, len(self.md_files)

def main():
    """Main function to run the converter"""
    
    print("🚀 MD to JSON Converter for Label Studio")
    print("=" * 50)
    print("📋 This script converts all .md files in the current directory")
    print("📋 to JSON format suitable for Label Studio annotation projects.")
    print()
    
    # Create converter and run batch conversion
    converter = MDToJSONConverter()
    successful, total = converter.batch_convert()
    
    if total > 0:
        print(f"\n📊 Conversion completed: {successful}/{total} files processed successfully")
        if successful == total:
            print("🎯 Ready for Label Studio import!")
        else:
            print("⚠️ Please check error messages and fix any issues before proceeding.")

if __name__ == "__main__":
    main()