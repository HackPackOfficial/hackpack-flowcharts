// Utility function to convert JSON to mermaid
// These types and utils are used in the IDE to parse JSON to mermaid.

// Type for block content
export type BlockContent = {
    type: 'copy' | 'video' | 'image';
    id: string;
    title?: string;
    content?: any;
};

// Type for troubleshooting guides
export type TroubleshootingGuideProps = {
    id: string;
    title: string;
    description: string;
    startingQuestion: string;
    color: string;
    customArrow?: string;
    questions: Record<string, {
        question: string;
        customArrow?: string;
        blocks?: BlockContent[];
        answers: Array<{
            answer?: string;
            nextQuestion?: string;
            customArrow?: string;
        }>;
    }>;
}

export default function getMermaidFromJSON(chartJSON: TroubleshootingGuideProps, highlightNode?: string): string {
    try {
        let queue = ["Title"];
        const doneNodes = new Set();
        const doneArrows = new Set();
        let round = 0;
        let builtChart = "";

        let escapeContent = (content: String) => content
            .replaceAll('"', '&quot;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('`', '&#96;');

        while (queue.length > 0) {
            round += 1;
            if (round > 1000) {
                return "";
            }

            let buildCharSeg = "";

            const batch = new Set();
            queue.forEach(nodeName => {
                const node = chartJSON.questions[nodeName];
                if (node) {
                    // Escape content for Mermaid - keep it minimal
                    let escapedContent = escapeContent(node.question);

                    // Parse markdown links to <a> links so they look blue
                    escapedContent = escapedContent.replace(
                        /\[([^\]]+)\]\(([^)]+)\)/g,
                        (_, text, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`
                    );

                    buildCharSeg += `${nodeName}["\`${escapedContent}\`"]\n`;

                    node.answers?.forEach((answerObject) => {
                        const nextNodeName = answerObject.nextQuestion || "NodeNotDefined";
                        const arrow = answerObject.customArrow || node.customArrow || "-->";
                        const noArrow = "customArrow" in answerObject && !answerObject.customArrow; // Explicitly no arrow
                        const edgeKey = `${nodeName}-${arrow}-${nextNodeName}`; // Unique key for arrow

                        if (noArrow) return;

                        if (!doneArrows.has(edgeKey) && nextNodeName) {
                            doneArrows.add(edgeKey);
                            if (answerObject.answer)
                                buildCharSeg += `${nodeName} ${arrow} |"${escapeContent(answerObject.answer)}"| ${nextNodeName}\n`;
                            else
                                buildCharSeg += `${nodeName} ${arrow} ${nextNodeName}\n`;
                        }

                        if (!doneNodes.has(nextNodeName)) {
                            doneNodes.add(nextNodeName);
                            batch.add(nextNodeName);
                        }
                    });
                }
            });

            builtChart += buildCharSeg;
            queue = Array.from(batch) as string[];
        }

        // Indent chart
        builtChart = builtChart.replaceAll(/^/gm, "    ").trim();

        builtChart =
            `flowchart TD\n` +
            `    ${builtChart}`;

        if (highlightNode) {
            builtChart += `\n    style ${highlightNode} stroke-width:4px;`;
        }

        return builtChart;

    } catch (e) {
        return "";
    }
}
