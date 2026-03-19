# Translation Quality Management

This repository presents a translation quality management system (TQMS) designed based upon international standards by technical committee ASTM F43 on Language Services and Products.

Within translation quality management, translation evaluations are conducted to teach human translators and train GAI systems to produce quality translations. This repo presents a methodology for producing and using annotated translations. The annotations are carried out following the [MQM standard](https://themqm.org) and proposals for a holistic translation quality standard that are being developed in part in [ASTM F43](https://astmf43.wordpress.com). In the program presented here, annotations are produced in the Label Studio environment. 

Here, the workflow is:

- A translator carries out translation in a markdown (.md) file.
- The translations in markdown format are converted to Label Studio compatible JSON format.
- The JSON export from Label Studio for a project is made pretty.
- Evaluations are distributed to the human translator on a dynamic webpage.
- Where multiple annotators have evaluated the same text, the agreement reflected in their work is measured.

The annotations that are produced can be used to teach evaluators to carry out better evaluations, to train LLMs to perform quality evaluations, and to produce feedback that can help translators to learn to translate better. Better translations by humans can be used to train LLMs to achieve the same thing.

## Assumptions

### Standards-Based Approach to Translation

The workflow and materials presented in this repository assume that best practices outlined in the following ASTM F43 standards are being followed:

- F2575 Standard Practice for Language Translation
- WK46396 Practice for Analytic Evaluation of Translation Quality (MQM) (draft standard)
- WK54884 Holistic Quality Evaluation System for Translation (H-Quest) (draft standard)

According to F2575, translation projects must begin with the definition of specifications (requirements, outcomes) and it is recommended that a translation > editing > proofreading (TEP) workflow be followed. WK46396 presents a methodology for identifying translation errors based on the [MQM typology](https://themqm.org/the-mqm-typology/) to carry out preventative and corrective action in workflows. WK54884 presents a methodology for evaluating the holistic quality of a translation as a whole document, in contrast to the decontextualized sentence-by-sentence approach that is the status quo of translation technology. This repository combines the MQM and H-Quest methodologies in evaluating translation quality.

#### Multidimensional Quality Metrics

The error typology used to labeled translation errors can be found in: `3_label_studio_input/MQM-Custom.txt`. This file presents the typology in the format that is used to configure the labeling interface within Label Studio. (More on Label Studio below.)

Note: In this labeling configuration, we've adapted the MQM Core Typology to meet our purpose.

#### Holistic Quality Evaluation

After marking individual errors and understanding the nature of the errors reflected in the translation, the text receives holistic quality ratings in the areas of correspondence and readability. Those ratings are then used to determine if a translation is effective or not, given the audience and the purpose of the text.

The methodology for correlating correspondence and readability with translation effectiveness is described in `5_evaluations_for_distribution/translation-evaluations.html`.

### Annotations from Label Studio 

This overall program assumes that [Label Studio](https://labelstud.io) will be used to carry out evaluations.

#### Why Label Studio? Why not use TEnTs?

In status quo workflows, translation quality evaluations take place in translation environment tools (TEnTs), in which source and target content is subdivided into decontextualized matching sentence pairs. The workflow presented in this repository specifically departs from that approach. Rather than presenting texts for sentence-by-sentence evaluation in a translation technology environment, whole texts are presented for evaluation within Label Studio for this implementation. This whole text approach allows for a contextualized quality evaluation to take place.

The benefits of taking a whole text approach are discussed in [Brandt (2025)](https://alainambrandt.locessentials.com/why-sentence-translation-wont-deliver) and [Post and Junczys-Dowmunt (2023)](https://drive.google.com/file/d/1Z4C2fGYNUMsbMOROqx7MEoGg5aZenOfC/view).

#### How to Get Access to and Use Label Studio

Label Studio is an open source annotation software. You can install Label Studio locally or set it up for cloud use. After that, you can set up labeling projects in it.

- [Installing Label Studio for Text Annotation](https://locessentials.com/blog/2025/02/27/installing-label-studio-for-text-annotation/)
- [Translation Error Annotation - Setting up Label Studio using MQM](https://locessentials.com/blog/2025/03/05/translation-error-annotation-setting-up-label-studio-using-mqm/)

To annotate texts within Label Studio, a a labeling interface configuration that presents the annotation methodology is required. The current iteration of the `MQM_Core-Adapted.txt` file based on MQM and H-Quest that is being used within this project is shared within this repository.

### Individual Annotations or Annotations by Groups

#### Annotations by Groups

The last folder in this repo contains a Jupyter notebook that can be used to calculate annotator agreement when multiple evaluators perform an evaluation of a single translation.

At first translation quality evaluators marking errors according to MQM (or any error typology) will do so inconsistently. This is because people view quality subjectively and an optimal error categorization is often not immediately clear. By using tools like visualizations and scoring, we can see where ideas don't overlap and work toward a harmonized performance.

- An evaluation project is set up in Label Studio that uses the current MQM/H-Quest labeling configuration
- A group of translation evaluators evaluate texts within Label Studio
  - They mark individual errors following MQM
  - They rate the quality of the content as a whole in terms of correspondence to the source text and readability as a standalone document given the project specifications following H-Quest
- JSON-MIN files of their work is exported and processed within the Jupyter notebook provided
- Within the Jupyter notebook, JSONs are pre-processed, exploratory analysis takes place, and performance around exact matching, F1 for partial matching, and Kappa for category agreement are calculated
- Based upon the results determined via Jupyter analysis, an improvement plan that prioritizes the highest priority changes is implemented (i.e. training materials, discussions)
- The work continues in this way until the annotations by a group of evaluators reach the minimum threshold scores for exact matching, F1 for partial matching, and Kappa for category agreement
- The evaluators are then deployed to produce annotations that can be used to achieve the individual annotation goals.

#### Individual Annotations

**Outcomes**

The workflow presented in this repository has the purpose of training translation evaluators/annotators to produce high quality annotated texts for use in:
- Giving feedback that will help translators improve
- Identifying, correcting and preventing common issues
- In the age of generative AI, producing high quality labeled data that can be used to teach the machines to identify labeled errors when carrying out automatic post editing.
- Quality human translations that are the outcome of this (or similar) training programs can then be used to train LLMs to generate the same thing.

### Visual Studio Code and the Live Server extension

This repo includes a web package via which Label Studio annotations can be displayed dynamically on a webpage: `5_evaluations_for_distribution/` The webpage is designed for local use and can be opened by opening the folder containing the website package in Visual Studio Code, and then loading the annotation data onto a local page via the Live Server extensions.

Download Visual Studio Code here: [https://code.visualstudio.com](https://code.visualstudio.com)

Then navigate to extensions in the side menu of VSC and install the Live Server extension.

More detailed instructions for getting the VSC environment ready can be found here: `5_evaluations_for_distribution/TranslationEvaluations-HowToDisplayYourFeedback.pdf`

### Why start with source files in markdown format?

As Andrej Karpathy states in his [Y Combinator 2025 talk](https://youtu.be/LCEmiRjPEtQ?si=mF66ukvERR6BPUc7), writing instructional content in [markdown format](https://www.markdownguide.org/basic-syntax) is becoming a best practice in the age of AI. Rather than making information difficult to access by using PDFs or complex visualizations systems, markdown content is already optimized for interpretation by both humans and machines.

## Workflow

### How exactly does the workflow work?

The workflow presented here is broken into 6 steps. These 6 steps are presented via the folder structure. The workflow is discussed in more detail after the folder structure.

```
translation-evaluations/
├── README.md       # This file
├── LICENSE         # GNU GPL-2.0
├── 1_source_text_md_format
│   └── intro-to-quality-reviews-sample.md          # Example of a source text in .md format
├── 2_md_to_json_conversion
│   └── md_to_json_converter.py                     # Script to convert translated.md to Label Studio compatible .json
├── 3_label_studio_input
│   ├── intro-to-quality-reviews-sample.json        # Example of a .md converted for import into Label Studio
│   └── MQM-Translation-Errors_Core-Adapted.txt     # Label Studio labeling interface code
├── 4_label_studio_ouput
│   ├── intro-to-quality-reviews-sample-markup.json # Example Label Studio output of a project with multiple evaluators of the same doc
│   └── parse_evaluations.py        # Script to make Label Studio outpt.json pretty for incorporation into translation-evaluations.html in the next step
├── 5_evaluation_for_distribution
│   ├── config.json                 # Where meta-data for .html page are configured
│   ├── scripts.js                  # Scripts to dynamically display annotations on webpage
│   ├── styles.css                  # Webpage styles
│   ├── intro-to-quality-reviews-sample-evaluation.json         # Example of Label Studio annotations made pretty for incorporation into .html
│   ├── translation-evaluations.html                            # Webpage that displays results
│   └── TranslationEvaluations-HowToDisplayYourFeedback.pdf     # Instructions on how to display .html via VSC
├── 6_annotator_agreement
│   ├── data                # Label Studio Output (from 4) where multiple evaluators have evaluated the same doc goes here
│   ├── reports             # Jupyter notebook exports an .html report of inter-annotator agreement here
│   │   └── QUALITY REVIEWS_report_2026-03-19.html    # Example inter-annotator agreement report
│   └── Translation_Annotator_Agreement.ipynb         # Jupyter notebook for analyzing inter-rater reliability of evaluations of a single doc by multiple annotators
```

### 1_source_text_md_format

Start by creating a source text for translation in markdown (.md) format. An example source text in markdown format is included in this directory.

### 2_md_to_json_conversion

Translations in markdown format, can be converted to Label Studio compatible JSON files by running `python md_to_json_converter.py`.

To use the tool in this folder:
1. Put the translations in .md format in this directory
2. Navigate to the directory in the terminal. 
3. Run: `python md_to_json_converter.py`

The tool will export the converted .json files to the `3_label_studio_input folder`

Note: The tool has a function to remove YAML frontmatter that does not need to be labeled. YAML frontmatter is metadata placed at the beginning of markdown files, enclosed between triple dashes (---). It's used by static site generators and content management systems to store structured information about a page.

### 3_label_studio_input

The files in this folder are used in the Label Studio projects that are annotated.

1. Create your Label Studio project
2. Import the generated JSON files from the previous step into Label Studio
3. Copy the contents of the `MQM-Translation-Errors_Core-Adapted.txt` file into the Labeling Interface (or create your own labeling interface) in Label Studio
4. Do the annotation
5. Export the annotations from a Label Studio project to the `4_label_studio_ouput` folder

### 4_label_studio_ouput

Export the annotations from a Label Studio project here. Run `python parse_evaluations.py` or `python parse_evaluations.py translation-evaluation.json` to separate the evaluations of multiple files in one project file into unique JSON files. The script will also make the format of the JSON optimal for its display in the translation evaluations webpage discussed in the next step.

### 5_evaluation_for_distribution

This folder contains the web package necessary to display annotations dynamically on a webpage. The translator can study the page to learn about the mistakes that they make when doing translations. This feedback contributes to their improvement.

Of all of the files provided, only the config.json page needs to be configured to use the page. In the configuration file, you can set the translator's name, the name of the evaluator, etc., and this information will be displayed dynamically on the webpage. Under evaluation_files, you can list the names of pretty JSONs you made in the previous step of the annotations conducted in Label Studio and relate these to a pretty name for display in the dropdown menu on the webpage. That way, translators can select to view annotations of different pieces of their work all via a single webpage.

#### Config.json

```
{
  "translator": "Translator's Name",
  "evaluator": "Alaina Brandt",
  "identifier": "QC",
  "period": "2026",
  "organization": "LocEssentials",
  "evaluation_files": {
    "intro-to-quality-reviews-sample-evaluation.json": "Quality Reviews"
  }
}
```

#### Translation Evaluations and Example Text Analysis

The [translation-evaluations.html](https://alainamb.github.io/translation-quality-mgmt/5_evaluations_for_distribution/translation-evaluations.html) page displays annotation data dynamically on the page. Via the dropdown menu, the annotation that one would like to view can be selected. The annotation that is available to view at the link is a markup of the example source text shared in `1_source_text_md_format/`. It is a markup of the areas of the source text, that if translated incorrectly, would result in errors in the translation.

The evaluation is presented in full text format, with highlights over the spans that have been annotated. The highlights have a hover dialogue box associated with them, that indicates the error dimension and type, the severity level, and the comments association with the annotation.

Then, the annotations are presented in a table view.

At the bottom of the page overall correspondence and readability scores are displayed, along with comments on document-level issues.

The page ends with a section on **Interpreting Your Translation Results**, which tells people how to determine the overall effectiveness of the translation, given the correspondence and readability scores.

#### How to...

- **Load the annotation data to the webpage?** Update the config.json file with your file names. 
- **Customize the identifying text on the webpage?** Update the config.json file with your meta-data. 
- **Customize the styles of the webpage?** Update the styles.css file with your style rules. 
- **Display the webpage?** Open **the folder** containing the web files (`5_evaluations_for_distribution`) in Visual Studio Code. Right click on and open the `translation-evaluations.html` file in Live Server.

### 6_annotator_agreement

Where multiple evaluators have evaluated a translation, the annotator agreement reflected in their work can be calculated and studies by running the `Translation_Annotator_Agreement.ipynb`.

Findings related to annotator agreement, such as exact matching, F1 for partial matching, and Cohen's Kappa for category agreement scores, can be used as an aid in helping a group of evaluators to harmonize their ideas and produce consistent work that will not confuse translators.

Note: To run the notebook, copy the 4_label_studio_output file to a `./data` folder in the 6_annotator_agreement folder. Cell 9 starting with `annotation_files` prints the Task #. Update the `doc_id=26` replacing 26 with your task number throughout the file to get document specific analysis (useful if your Label Studio project had multiple annotated files).

## References

- [The MQM Core Typology](https://themqm.org/the-mqm-typology/)
- ASTM F2575-23e2, Standard Practice for Language Translation
- ASTM WK46396, Practice for Analytic Evaluation of Translation Quality (draft standard)
- ASTM WK54884, Holistic Quality Evaluation System for Translation (draft standard)
- Alaina Brandt (2025) - [Why Sentence-by-Sentence Translation Won't Deliver Hyper-Personalization](https://alainambrandt.locessentials.com/why-sentence-translation-wont-deliver)
- Post and Junczys-Dowmunt of Microsoft (2023) - [Escaping the sentence-level paradigm in machine translation](https://drive.google.com/file/d/1Z4C2fGYNUMsbMOROqx7MEoGg5aZenOfC/view)

## License
This repository is currently licensed under GNU GPL-2.0.

**License:** GNU General Public License v2.0

- ✅ **Permissions:** Commercial use, Modification, Distribution, Private use
- ❌ **Limitations:** Liability, Warranty
- ⏯️: **Conditions:** License and copyright notice, State changes, Disclose source, Same license

## GAI Disclaimer & Acknowledgement
The code presented in this repo was developed using the assistance of various Claude GAI models. Please review the repo thoroughly before integrating it into your implementation.