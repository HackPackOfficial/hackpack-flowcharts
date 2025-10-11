This repo contains the JSON flowcharts for CrunchLabs' Hack Pack boxes.

Common issues that many people might experience can be PRed to these flowcharts. Very rare issues, such as a pin not being soldered fully, are not useful on these flowcharts. The ideal issues are build issues people frequently make or common issues.



---

These flowcharts are processed into:

1. **Interactive Walkthroughs**: Step-by-step guides to troubleshoot issues.
2. **Mermaid.js Charts**: Visual flowcharts for better understanding.

## Structure of the `questions` Object

The `questions` object defines the flowchart structure. It starts with `Title` as the entry point, following Mermaid.js conventions. Each question includes:

- **`question`**: The text to display for the question.
- **`answers`**: An array of possible answers, each containing:
  - **`answer`**: The text of the option.
  - **`nextQuestion`**: The next question to navigate to based on the answer.
  - **`customArrow`** *(optional)*: Overrides the default `->` arrow for better flowchart aesthetics.

### Special Notes on `answers`
- The `answer` property can be `null` to create invisible options for spacing arrows in the flowchart.
- `customArrow` can also be defined at the root of a chart or on a question object to change the default arrow style globally or locally.

## Handling Mermaid.js Formatting

Mermaid.js formatting can sometimes be weird. The parser attempts to escape content as needed, but certain elements (e.g., embedded links) may need updates to the parser.
