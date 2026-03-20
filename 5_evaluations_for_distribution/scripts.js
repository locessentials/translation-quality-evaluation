// Global variables
let configData = null;
let evaluationData = null;
let tooltip = null;
let availableFiles = [];

// Color mapping for error categories (matching CSS highlight colors)
const categoryColors = {
    'terminology': '#1f6944',
    'accuracy': '#FF4A4A',
    'style': '#ef91c6', 
    'linguistic conventions': '#50A5E6',
    'locale conventions': '#ffbc00',
    'audience appropriateness': '#691f44',
};

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    tooltip = document.getElementById('tooltip');
    loadConfigAndSetup();
});

// Load config file first, then set up the page
async function loadConfigAndSetup() {
    try {
        const response = await fetch('./config.json');
        if (!response.ok) {
            throw new Error('Could not load config.json file');
        }
        
        configData = await response.json();
        
        // Update page elements with config data
        updatePageWithConfig();
        
        // Scan for available files and populate dropdown
        await scanForEvaluationFiles();
        
    } catch (error) {
        console.error('Error loading config:', error);
        document.getElementById('loading').innerHTML = 
            '<div class="error">Error loading config.json file. Please ensure the file is in the same directory as this HTML file.</div>';
    }
}

// Update page elements with config data
function updatePageWithConfig() {
    // Update page title
    document.getElementById('page-title').textContent = 
        `${configData.identifier} - Translation Evaluations`;
    
    // Update document title
    document.title = `${configData.identifier} - Translation Evaluations`;
    
    // Update translator name
    document.getElementById('translator-name').textContent = configData.translator;
    
    // Update footer
    document.getElementById('footer-text').textContent = 
        `Evaluation conducted by ${configData.evaluator} for ${configData.identifier} - ${configData.period} at ${configData.organization}`;
}

// Scan for available evaluation files
async function scanForEvaluationFiles() {
    availableFiles = [];
    
    // Use files directly from config
    for (const [filename, displayName] of Object.entries(configData.evaluation_files)) {
        // Test if the file actually exists
        try {
            const response = await fetch(`./${filename}`);
            if (response.ok) {
                availableFiles.push({
                    pattern: filename,
                    displayName: displayName,
                    files: [filename]
                });
            }
        } catch (error) {
            console.log(`File ${filename} not found`);
        }
    }
    
    populateDropdown();
}

// Populate the dropdown with available translations
function populateDropdown() {
    const dropdown = document.getElementById('translation-dropdown');
    
    // Clear existing options
    dropdown.innerHTML = '';
    
    if (availableFiles.length === 0) {
        dropdown.innerHTML = '<option value="">No evaluation files found</option>';
        dropdown.disabled = true;
        return;
    }
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a translation...';
    dropdown.appendChild(defaultOption);
    
    // Add options for each available file group
    availableFiles.forEach(fileGroup => {
        fileGroup.files.forEach(filename => {
            const option = document.createElement('option');
            option.value = filename;
            option.textContent = fileGroup.displayName;
            dropdown.appendChild(option);
        });
    });
    
    // Enable dropdown and add event listener
    dropdown.disabled = false;
    dropdown.addEventListener('change', handleTranslationSelection);
    
    // Hide initial loading message
    document.getElementById('loading').style.display = 'none';
}

// Handle translation selection from dropdown
async function handleTranslationSelection(event) {
    const selectedFile = event.target.value;
    
    if (!selectedFile) {
        // Hide content if no selection
        document.getElementById('content').style.display = 'none';
        return;
    }
    
    // Show loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('loading').innerHTML = '<h3>Loading evaluation data...</h3>';
    document.getElementById('content').style.display = 'none';
    
    try {
        await loadEvaluationData(selectedFile);
    } catch (error) {
        console.error('Error loading evaluation:', error);
        document.getElementById('loading').innerHTML = 
            `<div class="error">Error loading ${selectedFile}. Please check the file format.</div>`;
    }
}

// Load evaluation data from selected file
async function loadEvaluationData(filename) {
    try {
        const response = await fetch(`./${filename}`);
        if (!response.ok) {
            throw new Error(`Could not load ${filename}`);
        }
        
        evaluationData = await response.json();
        displayEvaluationData();
        
    } catch (error) {
        throw error;
    }
}

// Display the evaluation data
function displayEvaluationData() {
    try {
        // Display annotated text
        displayAnnotatedText();

        // Display legend
        displayLegend();

        // Display summary table
        displaySummaryTable();

        // Display overall scores
        displayOverallScores();

        // Show content and hide loading
        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'block';

    } catch (error) {
        console.error('Error displaying evaluation data:', error);
        document.getElementById('loading').innerHTML = 
            '<div class="error">Error processing evaluation data. Please check the JSON file format.</div>';
    }
}

// Simple markdown renderer
function renderMarkdown(text) {
    // First, protect existing HTML spans from being processed
    const protectedSpans = [];
    let protectedText = text.replace(/<span[^>]*>.*?<\/span>/g, (match, offset) => {
        const placeholder = `__PROTECTED_SPAN_${protectedSpans.length}__`;
        protectedSpans.push(match);
        return placeholder;
    });
    
    // Split into lines and process tables and blockquotes properly
    const lines = protectedText.split('\n');
    let processedLines = [];
    let i = 0;
    
    while (i < lines.length) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        // Check if this is a table row
        if (trimmedLine.match(/^\|.*\|$/)) {
            // Start of table - collect all table rows
            const tableRows = [];
            
            while (i < lines.length && lines[i].trim().match(/^\|.*\|$/)) {
                const currentLine = lines[i].trim();
                
                // Skip separator lines (---|---|---)
                if (!currentLine.match(/^\|[\s]*:?-+:?[\s]*(\|[\s]*:?-+:?[\s]*)*\|$/)) {
                    const cells = currentLine.split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim());
                    tableRows.push(cells);
                }
                i++;
            }
            
            // Convert table rows to HTML
            if (tableRows.length > 0) {
                processedLines.push('<table>');
                
                tableRows.forEach((cells, rowIndex) => {
                    const cellTag = rowIndex === 0 ? 'th' : 'td';
                    const row = cells.map(cell => `<${cellTag}>${cell}</${cellTag}>`).join('');
                    processedLines.push(`<tr>${row}</tr>`);
                });
                
                processedLines.push('</table>');
            }
        } else if (trimmedLine.match(/^>\s*/)) {
            // Start of blockquote - collect all consecutive blockquote lines
            const blockquoteLines = [];
            
            while (i < lines.length && lines[i].trim().match(/^>\s*/)) {
                const quoteLine = lines[i].trim().replace(/^>\s*/, '');
                blockquoteLines.push(quoteLine);
                i++;
            }
            
            // Convert blockquote lines to HTML - preserve line breaks
            if (blockquoteLines.length > 0) {
                const blockquoteContent = blockquoteLines.join('\n');
                processedLines.push(`<blockquote>${blockquoteContent}</blockquote>`);
            }
        } else {
            // Regular line - preserve as-is for now
            processedLines.push(line);
            i++;
        }
    }
    
    let html = processedLines.join('\n');
    
    // Now process other markdown elements
    html = html
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Horizontal rules
        .replace(/^---+$/gm, '<hr>')
        // Bold - be more careful about existing HTML
        .replace(/\*\*((?:(?!\*\*).)+)\*\*/gim, '<strong>$1</strong>')
        // Italic  
        .replace(/\*((?:(?!\*).)+)\*/gim, '<em>$1</em>')
        // Links - make links functional
        .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>');
    
    // Handle paragraphs and line breaks more carefully
    // First, split by double newlines to identify paragraph boundaries
    const paragraphs = html.split(/\n\s*\n/);
    const processedParagraphs = paragraphs.map(para => {
        const trimmed = para.trim();
        if (!trimmed) return '';
        
        // Don't wrap already-wrapped HTML elements
        if (trimmed.match(/^<(h[1-6]|table|blockquote|hr)/i)) {
            return trimmed;
        }
        
        // Convert single line breaks to <br> within paragraphs
        const withBreaks = trimmed.replace(/\n/g, '<br>');
        return `<p>${withBreaks}</p>`;
    });
    
    html = processedParagraphs.filter(p => p).join('\n\n');
    
    // Restore protected spans
    protectedSpans.forEach((span, index) => {
        html = html.replace(`__PROTECTED_SPAN_${index}__`, span);
    });
    
    return html;
}

// Display the annotated text with highlights
function displayAnnotatedText() {
    const textContainer = document.getElementById('annotated-text');
    
    // Use the translator's translation text
    let translatedText = evaluationData.source_text || '';
    const annotations = evaluationData.annotation_data.result || [];

    // Filter for text annotations only (exclude ratings and comments)
    const textAnnotations = annotations.filter(ann => 
        ann.value && 
        ann.value.start !== undefined && 
        ann.value.end !== undefined &&
        ann.value.text &&
        ann.to_name === 'text' &&
        ann.type === 'labels' &&
        ann.from_name === 'label'
    );

    if (textAnnotations.length === 0) {
        // No annotations, just render markdown
        let renderedHtml = renderMarkdown(translatedText);
        if (!renderedHtml.includes('<')) {
            renderedHtml = '<p>' + renderedHtml + '</p>';
        }
        textContainer.innerHTML = renderedHtml;
        return;
    }

    // Create a list of all annotation boundaries
    const boundaries = [];
    textAnnotations.forEach((annotation, index) => {
        const { start, end } = annotation.value;
        boundaries.push({ pos: start, type: 'start', annotation, index });
        boundaries.push({ pos: end, type: 'end', annotation, index });
    });

    // Sort boundaries by position
    boundaries.sort((a, b) => {
        if (a.pos !== b.pos) return a.pos - b.pos;
        // If positions are equal, process 'end' before 'start' to handle adjacent spans
        return a.type === 'end' ? -1 : 1;
    });

    // Process text segments between boundaries
    let processedText = '';
    let lastPos = 0;
    let activeAnnotations = [];
    const annotationMap = new Map();

    boundaries.forEach(boundary => {
        // Add text segment before this boundary
        if (boundary.pos > lastPos) {
            const segment = translatedText.substring(lastPos, boundary.pos);
            
            if (activeAnnotations.length > 0) {
                // Build nested spans for overlapping annotations, outermost first
                let segmentHtml = segment;
                [...activeAnnotations].reverse().forEach(activeAnn => {
                    const category = getCategoryFromLabel(activeAnn.annotation);
                    const impact = getImpact(activeAnn.annotation);
                    const isQM = isQualityMarker(activeAnn.annotation);
                    const qmClass = isQM ? " quality-marker" : "";
                    const cssClasses = `highlight ${category.replace(/\s+/g, "-")} impact-${impact}${qmClass}`;
                    segmentHtml = `<span class="${cssClasses}" data-annotation-index="${activeAnn.index}">${segmentHtml}</span>`;
                    annotationMap.set(activeAnn.index, activeAnn.annotation);
                });
                processedText += segmentHtml;
            } else {
                // No highlighting - add segment as-is (don't escape yet)
                processedText += segment;
            }
        }

        // Update active annotations
        if (boundary.type === 'start') {
            activeAnnotations.unshift({ annotation: boundary.annotation, index: boundary.index });
        } else {
            // Remove this annotation from active list
            activeAnnotations = activeAnnotations.filter(a => a.index !== boundary.index);
        }

        lastPos = boundary.pos;
    });

    // Add remaining text after last boundary
    if (lastPos < translatedText.length) {
        const segment = translatedText.substring(lastPos);
        processedText += segment;
    }

    // Now render markdown on the processed text
    let renderedHtml = renderMarkdown(processedText);
    
    // Wrap in paragraph if needed
    if (!renderedHtml.includes('<')) {
        renderedHtml = '<p>' + renderedHtml + '</p>';
    }

    textContainer.innerHTML = renderedHtml;

    // Add event listeners for tooltips
    const highlights = textContainer.querySelectorAll('.highlight');
    highlights.forEach((highlight) => {
        highlight.addEventListener('mouseenter', (event) => showTooltip(event, annotationMap));
        highlight.addEventListener('mouseleave', hideTooltip);
    });
}

// Helper function to escape regex special characters
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Display legend
function displayLegend() {
    const legendContainer = document.getElementById('legend');
    const annotations = evaluationData.annotation_data.result || [];
    const categories = new Set();

    // Collect all categories used - only from label annotations
    annotations.filter(ann => ann.type === 'labels' && ann.from_name === 'label').forEach(annotation => {
        const category = getCategoryFromLabel(annotation);
        if (category) categories.add(category);
    });

    // Debug: log the categories found
    console.log('Categories found:', Array.from(categories));

    // Define all possible error dimensions with proper names
    const allDimensions = {
        'terminology': 'Terminology',
        'accuracy': 'Accuracy',
        'style': 'Style', 
        'linguistic conventions': 'Linguistic Conventions',
        'locale conventions': 'Locale Conventions',
        'audience appropriateness': 'Audience Appropriateness'
    };

    let legendHtml = '<div class="legend-section">';
    legendHtml += '<h4>Error Dimensions</h4>';
    legendHtml += '<div class="legend-items">';

    // Show all dimensions, but highlight only the ones actually used
    Object.keys(allDimensions).forEach(category => {
        const color = categoryColors[category] || '#95a5a6';
        const label = allDimensions[category];
        const isUsed = categories.has(category);
        const opacity = isUsed ? '1' : '0.3';
        
        console.log(`Category: ${category}, isUsed: ${isUsed}, opacity: ${opacity}`);
        
        legendHtml += `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${color}; opacity: ${opacity};"></div>
                <span style="opacity: ${opacity};">${label}</span>
            </div>
        `;
    });

    legendHtml += '</div></div>';

    // Add impact legend as a separate section
    legendHtml += '<div class="legend-section">';
    legendHtml += '<h4>Impact Levels</h4>';
    legendHtml += '<div class="legend-items">';
    legendHtml += `
        <div class="legend-item">
            <div class="legend-color" style="background-color:#95a5a6;"></div>
            <span>Neutral</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color:#f0c040;"></div>
            <span>Moderate</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color:#e67e22;"></div>
            <span>Strong</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color:#e74c3c;"></div>
            <span>Showstopper</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color:#2ecc71;"></div>
            <span style="font-style:italic;">★ Quality Marker (any impact)</span>
        </div>
    `;
    legendHtml += '</div></div>';

    legendContainer.innerHTML = legendHtml;
}

// Display summary table
function displaySummaryTable() {
    const tbody = document.getElementById('issues-tbody');
    const annotations = evaluationData.annotation_data.result || [];

    // Filter for text annotations only - FIXED: more specific filtering
    const textAnnotations = annotations.filter(ann => 
        ann.value && 
        ann.value.text &&
        ann.to_name === 'text' &&
        ann.type === 'labels' &&
        ann.from_name === 'label'  // Added this to be more specific
    );

    let tableHtml = '';
    textAnnotations.forEach(annotation => {
        const { text } = annotation.value;
        const category = getCategoryFromLabel(annotation);
        const subcategory = getSubcategory(annotation);
        const severity = getSeverity(annotation);
        const comments = getComments(annotation);

        const impact = getImpact(annotation);
        const isQM = isQualityMarker(annotation);
        const impactClass = isQM ? `impact-qm-${impact}` : `impact-${impact}`;
        const impactBadge = `<span class="impact-badge ${impactClass}">${impact.charAt(0).toUpperCase() + impact.slice(1)}</span>`;
        const dimDisplay = category.charAt(0).toUpperCase() + category.slice(1);
        const dimClass = category.replace(/\s+/g, '-');
        const dimBadge = `<span class="dimension-badge ${dimClass}">${dimDisplay}</span>`;
        const qmNote = isQM ? ' <span class="qm-badge">★</span>' : '';

        tableHtml += `
            <tr>
                <td class="text-segment">${escapeHtml(text)}</td>
                <td>${dimBadge}${qmNote}</td>
                <td>${escapeHtml(subcategory)}</td>
                <td>${impactBadge}</td>
                <td class="comments-cell">${escapeHtml(comments)}</td>
            </tr>
        `;
    });

    tbody.innerHTML = tableHtml;
}

// Display overall scores
function displayOverallScores() {
    const annotations = evaluationData.annotation_data.result || [];
    
    // Find overall scores
    const correspondenceRating = annotations.find(ann => ann.from_name === 'overall_correspondence');
    const readabilityRating = annotations.find(ann => ann.from_name === 'overall_readability');
    const correspondenceComments = annotations.find(ann => ann.from_name === 'correspondence_comments');
    const readabilityComments = annotations.find(ann => ann.from_name === 'readability_comments');
    const documentIssues = annotations.find(ann => ann.from_name === 'document_issues');

    // Display correspondence score
    if (correspondenceRating && correspondenceRating.value) {
        document.getElementById('correspondence-score').textContent = correspondenceRating.value.rating || '-';
    }

    if (correspondenceComments && correspondenceComments.value && correspondenceComments.value.text) {
        document.getElementById('correspondence-comment').textContent = correspondenceComments.value.text[0] || '';
    }

    // Display readability score  
    if (readabilityRating && readabilityRating.value) {
        document.getElementById('readability-score').textContent = readabilityRating.value.rating || '-';
    }

    if (readabilityComments && readabilityComments.value && readabilityComments.value.text) {
        document.getElementById('readability-comment').textContent = readabilityComments.value.text[0] || '';
    }

    // Display document issues
    if (documentIssues && documentIssues.value && documentIssues.value.text) {
        document.getElementById('document-comments-content').textContent = documentIssues.value.text[0] || '';
    }
}

// Show tooltip
function showTooltip(event, markerMap) {
    const highlight = event.target;
    const annotationIndex = parseInt(highlight.dataset.annotationIndex);
    
    if (annotationIndex === undefined || !markerMap.has(annotationIndex)) return;
    
    const annotation = markerMap.get(annotationIndex);
    
    if (!annotation) return;

    const category = getCategoryFromLabel(annotation);
    const subcategory = getSubcategory(annotation);
    const impact = getImpact(annotation);
    const isQM = isQualityMarker(annotation);
    const comments = getComments(annotation);

    const qmBadge = isQM ? ' <span style="color:#f0c040;">★ Quality Marker</span>' : '';
    let tooltipContent = `
        <div class="tooltip-info"><strong>Dimension:</strong> ${category.charAt(0).toUpperCase() + category.slice(1)}${qmBadge}</div>
        <div class="tooltip-info"><strong>Type:</strong> ${escapeHtml(subcategory)}</div>
        <div class="tooltip-info"><strong>Impact:</strong> ${impact.charAt(0).toUpperCase() + impact.slice(1)}</div>
    `;
    /* Add <div class="tooltip-header">${highlight.textContent}</div> to the
    list above to show the text segment that was highlighted in the tooltip */

    if (comments) {
        tooltipContent += `<div class="tooltip-comment">${escapeHtml(comments)}</div>`;
    }

    const tooltip = document.getElementById('tooltip');
    tooltip.innerHTML = tooltipContent;
    positionTooltip(event);
    tooltip.classList.add('show');
}

// Hide tooltip
function hideTooltip() {
    tooltip.classList.remove('show');
}

// Position tooltip to avoid viewport boundaries
function positionTooltip(event) {
    const tooltip = document.getElementById('tooltip');
    const rect = event.target.getBoundingClientRect();
    
    // Force a reflow to get accurate tooltip dimensions
    tooltip.style.visibility = 'hidden';
    tooltip.style.display = 'block';
    const tooltipRect = tooltip.getBoundingClientRect();
    tooltip.style.display = '';
    tooltip.style.visibility = '';
    
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    let top = rect.top - tooltipRect.height - 10;

    // Adjust horizontal position if tooltip goes off screen
    if (left < 10) {
        left = 10;
    } else if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
    }

    // Adjust vertical position if tooltip goes off top of screen
    if (top < 10) {
        top = rect.bottom + 10;
    }

    // Add scroll offset for proper positioning
    top += window.pageYOffset;
    left += window.pageXOffset;

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
}

// Helper functions to extract data from annotations
function getCategoryFromLabel(annotation) {
    if (annotation.value && annotation.value.labels && annotation.value.labels.length > 0) {
        let category = annotation.value.labels[0].toLowerCase();
        
        // Map the category names to match our color keys
        if (category === 'linguistic conventions') return 'linguistic conventions';
        if (category === 'locale conventions') return 'locale conventions';
        if (category === 'audience appropriateness') return 'audience appropriateness';
        
        return category;
    }
    return 'other';
}

// Check if an annotation is marked as Quality Marker
function isQualityMarker(annotation) {
    const result = evaluationData.annotation_data.result;
    const subcatAnnotation = result.find(ann => 
        ann.from_name === 'subcategories' && 
        ann.id === annotation.id
    );
    return subcatAnnotation && 
           subcatAnnotation.value && 
           subcatAnnotation.value.choices && 
           subcatAnnotation.value.choices[0] === 'Quality Marker';
}


// FIXED: Better subcategory extraction
function getSubcategory(annotation) {
    const result = evaluationData.annotation_data.result;
    const subcategoryAnnotation = result.find(ann => 
        ann.from_name === 'subcategories' && 
        ann.id === annotation.id
    );
    
    if (subcategoryAnnotation && subcategoryAnnotation.value && subcategoryAnnotation.value.choices && subcategoryAnnotation.value.choices.length > 0) {
        return subcategoryAnnotation.value.choices[0];
    }
    return 'N/A';
}

function getImpact(annotation) {
    const result = evaluationData.annotation_data.result;
    const impactAnnotation = result.find(ann => 
        ann.from_name === 'impact' && 
        ann.id === annotation.id
    );
    
    if (impactAnnotation && impactAnnotation.value && impactAnnotation.value.choices) {
        return impactAnnotation.value.choices[0].toLowerCase();
    }
    return 'neutral';
}

// Keep getSeverity as alias for backward compatibility
function getSeverity(annotation) {
    return getImpact(annotation);
}

function getComments(annotation) {
    const result = evaluationData.annotation_data.result;
    const commentAnnotation = result.find(ann => 
        ann.from_name === 'comments' && 
        ann.id === annotation.id
    );
    
    if (commentAnnotation && commentAnnotation.value && commentAnnotation.value.text) {
        return commentAnnotation.value.text[0] || '';
    }
    return '';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}