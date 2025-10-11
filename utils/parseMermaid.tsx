// Utility function to convert JSON to mermaid

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

function getMermaidFromJSON(chartJSON: TroubleshootingGuideProps, highlightNode?: string): string {
    try {
        let queue = ["Title"];
        const doneNodes = new Set();
        const doneArrows = new Set();
        let round = 0;
        let builtChart = "";

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
                    let escapedContent = node.question
                        .replaceAll('"', '&quot;')
                        .replaceAll('<', '&lt;')
                        .replaceAll('>', '&gt;')
                        .replaceAll('`', '&#96;');

                    // Parse markdown links to <a> links so they look blue
                    escapedContent = escapedContent.replace(
                        /\[([^\]]+)\]\(([^)]+)\)/g,
                        (_, text, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`
                    );

                    buildCharSeg += `${nodeName}["\`${escapedContent}\`"]\n`;

                    node.answers?.forEach((answerObject) => {
                        const nextNodeName = answerObject.nextQuestion;
                        const arrow = answerObject.customArrow || node.customArrow || "-->";
                        const edgeKey = `${nodeName}-${arrow}-${nextNodeName}`; // Unique key for arrow

                        if (!doneArrows.has(edgeKey)) {
                            doneArrows.add(edgeKey);
                            if (answerObject.answer)
                                buildCharSeg += `${nodeName} ${arrow} |${answerObject.answer}| ${nextNodeName}\n`;
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
