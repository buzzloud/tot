// Application State
const state = {
    keywordGroups: [],
    currentAnalysis: null,
    analysisHistory: [],
    currentTab: 'my-site'
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    setupNavigation();
    renderKeywordGroups();
    renderHistory();
    updateKeywordGroupSelect();
});

// Navigation
function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.getAttribute('href').substring(1);
            switchSection(section);
        });
    });
}

function switchSection(sectionName) {
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionName}`) {
            link.classList.add('active');
        }
    });

    // Update sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionName}-section`).classList.add('active');
}

// Competitor URL Management
function addCompetitorUrl() {
    const container = document.getElementById('competitor-urls-container');
    const urlGroup = document.createElement('div');
    urlGroup.className = 'url-input-group';
    urlGroup.innerHTML = `
        <input type="url" class="input-field competitor-url" placeholder="https://competitor.com">
        <button class="btn-icon btn-remove" onclick="removeCompetitorUrl(this)">×</button>
    `;
    container.appendChild(urlGroup);
}

function removeCompetitorUrl(button) {
    button.parentElement.remove();
}

// Keyword Groups Management
function saveKeywordGroup() {
    const name = document.getElementById('group-name').value.trim();
    const keywordsText = document.getElementById('keywords-input').value.trim();
    
    if (!name || !keywordsText) {
        alert('Please provide both group name and keywords');
        return;
    }

    const keywords = keywordsText.split('\n')
        .map(k => k.trim())
        .filter(k => k.length > 0);

    if (keywords.length === 0) {
        alert('Please add at least one keyword');
        return;
    }

    const group = {
        id: Date.now(),
        name: name,
        keywords: keywords,
        createdAt: new Date().toISOString()
    };

    state.keywordGroups.push(group);
    saveToLocalStorage();
    renderKeywordGroups();
    updateKeywordGroupSelect();

    // Clear form
    document.getElementById('group-name').value = '';
    document.getElementById('keywords-input').value = '';

    alert(`Group "${name}" saved with ${keywords.length} keywords!`);
}

function deleteKeywordGroup(groupId) {
    if (confirm('Are you sure you want to delete this group?')) {
        state.keywordGroups = state.keywordGroups.filter(g => g.id !== groupId);
        saveToLocalStorage();
        renderKeywordGroups();
        updateKeywordGroupSelect();
    }
}

function renderKeywordGroups() {
    const container = document.getElementById('groups-list');
    
    if (state.keywordGroups.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <div class="empty-state-text">No keyword groups yet. Create your first group above!</div>
            </div>
        `;
        return;
    }

    container.innerHTML = state.keywordGroups.map(group => `
        <div class="group-item">
            <div class="group-header">
                <div class="group-name">${escapeHtml(group.name)}</div>
                <div class="group-actions">
                    <button class="btn-secondary" onclick="deleteKeywordGroup(${group.id})">Delete</button>
                </div>
            </div>
            <div class="group-keywords">
                ${group.keywords.length} keywords: ${group.keywords.slice(0, 5).map(k => escapeHtml(k)).join(', ')}${group.keywords.length > 5 ? '...' : ''}
            </div>
        </div>
    `).join('');
}

function updateKeywordGroupSelect() {
    const select = document.getElementById('keyword-group-select');
    select.innerHTML = '<option value="">-- Select a group --</option>' + 
        state.keywordGroups.map(group => 
            `<option value="${group.id}">${escapeHtml(group.name)}</option>`
        ).join('');
}

// Analysis Functions
async function startAnalysis() {
    const groupId = document.getElementById('keyword-group-select').value;
    const myUrl = document.getElementById('my-url').value.trim();
    const competitorInputs = document.querySelectorAll('.competitor-url');
    const competitorUrls = Array.from(competitorInputs)
        .map(input => input.value.trim())
        .filter(url => url.length > 0);

    // Validation
    if (!groupId) {
        alert('Please select a keyword group');
        return;
    }

    if (!myUrl) {
        alert('Please enter your website URL');
        return;
    }

    const group = state.keywordGroups.find(g => g.id == groupId);
    if (!group) {
        alert('Selected group not found');
        return;
    }

    // Show loading state
    const btnText = document.getElementById('analyze-btn-text');
    const originalText = btnText.innerHTML;
    const analyzeBtn = document.querySelector('.btn-primary');
    
    btnText.innerHTML = '<span class="spinner"></span> Analyzing pages...';
    analyzeBtn.disabled = true;

    try {
        // Analyze all URLs
        const urls = [
            { url: myUrl, type: 'my-site', label: 'Your Site' },
            ...competitorUrls.map((url, i) => ({ 
                url, 
                type: 'competitor', 
                label: `Competitor ${i + 1}` 
            }))
        ];

        console.log(`Starting analysis of ${urls.length} URLs with ${group.keywords.length} keywords`);

        const results = [];
        
        // Analyze URLs one by one with progress feedback
        for (let i = 0; i < urls.length; i++) {
            const urlData = urls[i];
            btnText.innerHTML = `<span class="spinner"></span> Analyzing ${urlData.label} (${i + 1}/${urls.length})...`;
            
            console.log(`Analyzing: ${urlData.url}`);
            const result = await analyzeUrl(urlData.url, group.keywords, urlData);
            results.push(result);
            
            console.log(`Completed ${urlData.label}:`, result.stats);
        }

        // Create analysis object
        const analysis = {
            id: Date.now(),
            date: new Date().toISOString(),
            groupName: group.name,
            keywords: group.keywords,
            results: results,
            timestamp: Date.now()
        };

        state.currentAnalysis = analysis;
        state.analysisHistory.unshift(analysis);
        
        // Keep only last 20 analyses
        if (state.analysisHistory.length > 20) {
            state.analysisHistory = state.analysisHistory.slice(0, 20);
        }

        saveToLocalStorage();
        renderResults(analysis);
        renderHistory();

        // Scroll to results
        document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
        
        console.log('Analysis completed successfully!');

    } catch (error) {
        console.error('Analysis error:', error);
        alert('Error during analysis: ' + error.message + '\n\nPlease check the console for more details.');
    } finally {
        btnText.innerHTML = originalText;
        analyzeBtn.disabled = false;
    }
}

async function analyzeUrl(url, keywords, urlData) {
    console.log(`Starting analysis of: ${url}`);
    
    // Create a safe default result structure
    const createDefaultResult = (errorMsg = null) => {
        const defaultResult = {
            url: url,
            type: urlData.type,
            label: urlData.label,
            keywords: {},
            stats: {
                totalWords: 0,
                keywordsFound: 0,
                totalOccurrences: 0
            }
        };
        
        if (errorMsg) {
            defaultResult.error = errorMsg;
        }
        
        // Initialize all keywords with default values
        if (Array.isArray(keywords)) {
            keywords.forEach(keyword => {
                defaultResult.keywords[keyword] = {
                    found: false,
                    occurrences: 0,
                    locations: [],
                    density: 0
                };
            });
        }
        
        return defaultResult;
    };
    
    try {
        // Validate inputs
        if (!url || typeof url !== 'string') {
            throw new Error('Invalid URL provided');
        }
        
        if (!Array.isArray(keywords) || keywords.length === 0) {
            console.warn('No keywords provided for analysis');
            return createDefaultResult('No keywords provided');
        }
        
        // Fetch the page content using CORS proxy
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        console.log(`Fetching from proxy: ${proxyUrl}${url}`);
        
        const response = await fetch(proxyUrl + encodeURIComponent(url), {
            method: 'GET',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        
        if (!html || html.length === 0) {
            throw new Error('Received empty response from server');
        }
        
        console.log(`Received HTML (${html.length} characters)`);
        
        // Extract content from HTML
        const content = extractContent(html);
        console.log('Content extracted successfully');
        
        // Validate content
        if (!content || typeof content !== 'object') {
            throw new Error('Failed to extract content from page');
        }
        
        // Initialize result object with safe defaults
        const result = createDefaultResult();
        result.stats.totalWords = content.totalWords || 0;

        // Analyze each keyword
        console.log(`Analyzing ${keywords.length} keywords...`);
        
        for (let i = 0; i < keywords.length; i++) {
            const keyword = keywords[i];
            
            try {
                if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
                    console.warn(`Skipping invalid keyword at index ${i}`);
                    continue;
                }
                
                const keywordAnalysis = analyzeKeyword(keyword, content);
                
                if (!keywordAnalysis || typeof keywordAnalysis !== 'object') {
                    console.error(`Invalid analysis result for keyword: ${keyword}`);
                    continue;
                }
                
                result.keywords[keyword] = {
                    found: keywordAnalysis.occurrences > 0,
                    occurrences: keywordAnalysis.occurrences || 0,
                    locations: Array.isArray(keywordAnalysis.locations) ? keywordAnalysis.locations : [],
                    density: keywordAnalysis.occurrences > 0 && content.totalWords > 0
                        ? ((keywordAnalysis.occurrences / content.totalWords) * 100).toFixed(2) 
                        : '0.00'
                };

                if (keywordAnalysis.occurrences > 0) {
                    result.stats.keywordsFound++;
                    result.stats.totalOccurrences += keywordAnalysis.occurrences;
                }
                
                if ((i + 1) % 10 === 0) {
                    console.log(`Analyzed ${i + 1}/${keywords.length} keywords`);
                }
            } catch (keywordError) {
                console.error(`Error analyzing keyword "${keyword}":`, keywordError);
                // Keyword already has default values from createDefaultResult
            }
        }

        console.log(`Analysis complete for ${url}:`, result.stats);
        return result;
        
    } catch (error) {
        console.error(`Error analyzing ${url}:`, error);
        return createDefaultResult(error.message || 'Unknown error occurred');
    }
}

// Extract content from HTML, excluding navigation, header, footer
function extractContent(html) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Check if parsing was successful
        if (!doc || !doc.body) {
            console.error('Failed to parse HTML');
            return {
                title: '',
                metaDesc: '',
                headings: { H1: [], H2: [], H3: [], H4: [], H5: [], H6: [] },
                bodyText: '',
                totalWords: 0
            };
        }
        
        // Remove elements we don't want to analyze
        const elementsToRemove = [
            'script', 'style', 'noscript', 'iframe',
            'nav', 'header', 'footer',
            '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
            '.navigation', '.nav', '.menu', '.header', '.footer',
            '#header', '#footer', '#navigation', '#nav', '#menu'
        ];
        
        elementsToRemove.forEach(selector => {
            try {
                doc.querySelectorAll(selector).forEach(el => {
                    if (el && el.parentNode) {
                        el.parentNode.removeChild(el);
                    }
                });
            } catch (e) {
                console.warn(`Error removing selector ${selector}:`, e);
            }
        });
        
        // Extract different sections
        const title = doc.querySelector('title')?.textContent?.trim() || '';
        const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
        
        // Get all heading elements (H1-H6)
        const headings = {
            H1: [],
            H2: [],
            H3: [],
            H4: [],
            H5: [],
            H6: []
        };
        
        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
            try {
                const elements = Array.from(doc.querySelectorAll(tag));
                headings[tag.toUpperCase()] = elements
                    .map(el => el?.textContent?.trim() || '')
                    .filter(text => text.length > 0);
            } catch (e) {
                console.warn(`Error extracting ${tag}:`, e);
            }
        });
        
        // Get body content (main content area)
        let bodyText = '';
        
        try {
            // Try to find main content area
            const mainContent = doc.querySelector('main, [role="main"], .main-content, #main-content, article, .content');
            if (mainContent && mainContent.textContent) {
                bodyText = mainContent.textContent;
            } else if (doc.body && doc.body.textContent) {
                // Fallback to body
                bodyText = doc.body.textContent;
            }
        } catch (e) {
            console.warn('Error extracting body text:', e);
        }
        
        // Clean up text
        bodyText = bodyText.replace(/\s+/g, ' ').trim();
        
        // Count total words in body
        const words = bodyText.split(/\s+/).filter(word => word.length > 0);
        const totalWords = words.length;
        
        console.log('Content extracted:', {
            titleLength: title.length,
            metaDescLength: metaDesc.length,
            headingCounts: Object.keys(headings).map(tag => `${tag}: ${headings[tag].length}`).join(', '),
            totalWords: totalWords
        });
        
        return {
            title,
            metaDesc,
            headings,
            bodyText,
            totalWords
        };
    } catch (error) {
        console.error('Error in extractContent:', error);
        return {
            title: '',
            metaDesc: '',
            headings: { H1: [], H2: [], H3: [], H4: [], H5: [], H6: [] },
            bodyText: '',
            totalWords: 0
        };
    }
}

// Analyze a single keyword across all content sections
function analyzeKeyword(keyword, content) {
    const locations = [];
    let totalOccurrences = 0;
    
    // Validate inputs
    if (!keyword || typeof keyword !== 'string') {
        console.error('Invalid keyword:', keyword);
        return { occurrences: 0, locations: [] };
    }
    
    if (!content) {
        console.error('Invalid content object');
        return { occurrences: 0, locations: [] };
    }
    
    try {
        // Create case-sensitive regex for exact match
        // Escape special regex characters
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedKeyword, 'g');
        
        // Check in Title
        const titleMatches = content.title ? (content.title.match(regex) || []).length : 0;
        if (titleMatches > 0) {
            locations.push({ type: 'TITLE', count: titleMatches });
            totalOccurrences += titleMatches;
        }
        
        // Check in Meta Description
        const metaMatches = content.metaDesc ? (content.metaDesc.match(regex) || []).length : 0;
        if (metaMatches > 0) {
            locations.push({ type: 'META DESCRIPTION', count: metaMatches });
            totalOccurrences += metaMatches;
        }
        
        // Check in Headings (H1-H6)
        let headingMatches = 0;
        let headingType = '';
        
        if (content.headings && typeof content.headings === 'object') {
            Object.keys(content.headings).forEach(tag => {
                const headingTexts = content.headings[tag];
                if (Array.isArray(headingTexts)) {
                    headingTexts.forEach(text => {
                        if (text && typeof text === 'string') {
                            const matches = (text.match(regex) || []).length;
                            if (matches > 0) {
                                headingMatches += matches;
                                if (!headingType) headingType = tag; // Use the first heading type found
                            }
                        }
                    });
                }
            });
        }
        
        if (headingMatches > 0) {
            locations.push({ type: headingType || 'HEADING', count: headingMatches });
            totalOccurrences += headingMatches;
        }
        
        // Check in Body Content
        const bodyMatches = content.bodyText ? (content.bodyText.match(regex) || []).length : 0;
        
        // Subtract matches already counted in title, meta, and headings from body
        const bodyOnlyMatches = Math.max(0, bodyMatches - titleMatches - metaMatches - headingMatches);
        
        if (bodyOnlyMatches > 0) {
            locations.push({ type: 'BODY CONTENT', count: bodyOnlyMatches });
            totalOccurrences += bodyOnlyMatches;
        }
        
        return {
            occurrences: totalOccurrences,
            locations
        };
    } catch (error) {
        console.error('Error analyzing keyword:', keyword, error);
        return { occurrences: 0, locations: [] };
    }
}

function renderResults(analysis) {
    const resultsSection = document.getElementById('results-section');
    resultsSection.style.display = 'block';

    // Validate analysis object
    if (!analysis || !analysis.results || !Array.isArray(analysis.results) || analysis.results.length === 0) {
        resultsSection.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">No analysis results available</div>
            </div>
        `;
        return;
    }

    // Render summary stats (using "Your Site" data)
    const mySiteResult = analysis.results.find(r => r.type === 'my-site');
    if (mySiteResult && mySiteResult.keywords && !mySiteResult.error) {
        const totalKeywords = analysis.keywords ? analysis.keywords.length : 0;
        const keywordsFound = mySiteResult.stats ? mySiteResult.stats.keywordsFound : 0;
        const totalOccurrences = mySiteResult.stats ? mySiteResult.stats.totalOccurrences : 0;
        const totalWords = mySiteResult.stats ? mySiteResult.stats.totalWords : 1;
        const matchRate = totalKeywords > 0 ? ((keywordsFound / totalKeywords) * 100).toFixed(0) : 0;
        const density = totalWords > 0 ? ((totalOccurrences / totalWords) * 100).toFixed(2) : 0;

        document.getElementById('keywords-found').textContent = `${keywordsFound} / ${totalKeywords}`;
        document.getElementById('match-rate').textContent = `${matchRate}% match rate`;
        document.getElementById('total-occurrences').textContent = totalOccurrences;
        document.getElementById('keyword-density').textContent = `${density}%`;
        document.getElementById('word-count').textContent = `In ${totalWords.toLocaleString()} words`;
    } else {
        // Show error state for summary
        document.getElementById('keywords-found').textContent = 'N/A';
        document.getElementById('match-rate').textContent = 'Error occurred';
        document.getElementById('total-occurrences').textContent = '0';
        document.getElementById('keyword-density').textContent = '0%';
        document.getElementById('word-count').textContent = 'In 0 words';
    }

    // Render tabs
    const tabsContainer = document.getElementById('results-tabs');
    tabsContainer.innerHTML = analysis.results.map((result, index) => `
        <button class="tab ${index === 0 ? 'active' : ''}" onclick="switchTab('${result.type}', ${index})">
            ${escapeHtml(result.label)}${result.error ? ' ⚠️' : ''}
        </button>
    `).join('');

    // Render first tab content
    state.currentTab = analysis.results[0].type;
    renderTabContent(analysis, 0);

    // Render opportunity section
    try {
        renderOpportunities(analysis);
    } catch (error) {
        console.error('Error rendering opportunities:', error);
        document.getElementById('opportunity-content').innerHTML = `
            <p style="color: var(--danger-color);">Error displaying opportunities. Check console for details.</p>
        `;
    }
}

function switchTab(type, index) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });

    state.currentTab = type;
    renderTabContent(state.currentAnalysis, index);
}

function renderTabContent(analysis, resultIndex) {
    const result = analysis.results[resultIndex];
    const container = document.getElementById('results-content');

    if (result.error) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">Error analyzing this URL: ${escapeHtml(result.error)}</div>
                <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-light);">
                    This might be due to CORS restrictions or the page being unavailable.
                    Check the browser console for more details.
                </p>
            </div>
        `;
        return;
    }

    const tableRows = analysis.keywords.map(keyword => {
        const data = result.keywords[keyword];
        
        // Check if data exists and is valid
        if (!data || data === undefined) {
            console.warn(`No data found for keyword: ${keyword}`);
            return ''; // Skip this keyword
        }
        
        if (!data.found && result.type !== 'my-site') {
            return ''; // Don't show not found keywords for competitors
        }

        const foundIndicator = data.found 
            ? '<span class="found-indicator found-yes">✓</span>'
            : '<span class="found-indicator found-no">✗</span>';

        const occurrencesText = data.found 
            ? `<strong>${data.occurrences}</strong>` 
            : '<span class="not-found-text">NOT FOUND</span>';

        const densityText = data.found 
            ? `${data.density}%` 
            : '<span class="not-found-text">-</span>';

        // Build detailed location info with counts
        let locationsHtml = '';
        if (data.found && data.locations.length > 0) {
            locationsHtml = data.locations.map(loc => {
                const badgeClass = loc.type.toLowerCase().replace(' ', '-');
                return `<span class="location-badge ${badgeClass}" title="${loc.count} occurrence(s)">${loc.type} (${loc.count})</span>`;
            }).join(' ');
        } else {
            locationsHtml = '<span class="not-found-text">-</span>';
        }

        return `
            <tr>
                <td class="keyword-cell">${escapeHtml(keyword)}</td>
                <td style="text-align: center;">${foundIndicator}</td>
                <td style="text-align: center;">${occurrencesText}</td>
                <td style="text-align: center;">${densityText}</td>
                <td>${locationsHtml}</td>
            </tr>
        `;
    }).filter(row => row !== '').join('');

    // Add a note about analysis method
    const analysisNote = `
        <div style="margin-top: 1rem; padding: 1rem; background: var(--lighter-bg); border-radius: var(--radius-md); font-size: 0.875rem; color: var(--text-medium);">
            <strong>Analysis Details:</strong><br>
            • Total words analyzed: <strong>${result.stats.totalWords.toLocaleString()}</strong><br>
            • Keywords found: <strong>${result.stats.keywordsFound} / ${analysis.keywords.length}</strong><br>
            • Total occurrences: <strong>${result.stats.totalOccurrences}</strong><br>
            • Search method: <strong>Case-sensitive exact match</strong><br>
            • Excluded: Navigation, header, footer, scripts, styles
        </div>
    `;

    container.innerHTML = `
        <table class="results-table">
            <thead>
                <tr>
                    <th>KEYWORD</th>
                    <th style="text-align: center;">FOUND</th>
                    <th style="text-align: center;">OCCURRENCES</th>
                    <th style="text-align: center;">DENSITY</th>
                    <th>LOCATIONS (count)</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows || '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-light);">No keywords to display</td></tr>'}
            </tbody>
        </table>
        ${analysisNote}
    `;
}

function renderOpportunities(analysis) {
    const container = document.getElementById('opportunity-content');
    const mySiteResult = analysis.results.find(r => r.type === 'my-site');
    
    if (!mySiteResult || !mySiteResult.keywords) {
        container.innerHTML = '<p>No data available</p>';
        return;
    }

    const opportunities = [];

    // Find keywords that are on competitors but not on my site
    analysis.keywords.forEach(keyword => {
        // Check if keyword exists in mySiteResult
        if (!mySiteResult.keywords[keyword]) {
            console.warn(`Keyword "${keyword}" not found in my site results`);
            return;
        }
        
        const onMySite = mySiteResult.keywords[keyword].found;
        
        if (!onMySite) {
            const competitorsWithKeyword = analysis.results
                .filter(r => r.type === 'competitor' && r.keywords && r.keywords[keyword] && r.keywords[keyword].found)
                .map(r => ({
                    label: r.label,
                    url: r.url,
                    occurrences: r.keywords[keyword].occurrences || 0,
                    locations: r.keywords[keyword].locations || []
                }));

            if (competitorsWithKeyword.length > 0) {
                opportunities.push({
                    keyword: keyword,
                    competitors: competitorsWithKeyword
                });
            }
        }
    });

    if (opportunities.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✅</div>
                <div class="empty-state-text">Great! You're using all keywords that your competitors are using.</div>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <p style="margin-bottom: 1rem;">
            ${opportunities.length} tracked keyword${opportunities.length > 1 ? 's' : ''} not found on your page. 
            Consider incorporating them naturally into your content.
        </p>
        <ul class="opportunity-list">
            ${opportunities.map(opp => `
                <li class="opportunity-item">
                    <div class="opportunity-keyword">"${escapeHtml(opp.keyword)}"</div>
                    ${opp.competitors.map(comp => `
                        <div class="competitor-info">
                            Found on ${escapeHtml(comp.label)}: 
                            ${comp.occurrences} occurrence${comp.occurrences > 1 ? 's' : ''} 
                            ${comp.locations.length > 0 ? `(${comp.locations.map(l => l.type).join(', ')})` : ''}
                        </div>
                    `).join('')}
                </li>
            `).join('')}
        </ul>
    `;
}

// Export Functions
function exportToPDF() {
    alert('PDF export functionality will be implemented with jsPDF library');
    // TODO: Implement PDF export using jsPDF
}

function exportToHTML() {
    if (!state.currentAnalysis) {
        alert('No analysis to export');
        return;
    }

    const html = generateHTMLReport(state.currentAnalysis);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keyword-analysis-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
}

function generateHTMLReport(analysis) {
    const date = new Date(analysis.date).toLocaleString();
    const mySiteResult = analysis.results.find(r => r.type === 'my-site');
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Keyword Analysis Report - ${analysis.groupName}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1, h2 { color: #2E7FD2; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: 600; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat-card { background: #2E7FD2; color: white; padding: 20px; border-radius: 8px; flex: 1; }
        .found-yes { color: #28a745; font-weight: bold; }
        .found-no { color: #dc3545; font-weight: bold; }
        .location-badge { background: #2E7FD2; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin: 2px; display: inline-block; }
    </style>
</head>
<body>
    <h1>Keyword Analysis Report</h1>
    <p><strong>Report Date:</strong> ${date}</p>
    <p><strong>Keyword Group:</strong> ${analysis.groupName}</p>
    <p><strong>Total Keywords Analyzed:</strong> ${analysis.keywords.length}</p>

    <h2>Summary Statistics (Your Site)</h2>
    <div class="stats">
        <div class="stat-card">
            <h3>Keywords Found</h3>
            <p>${mySiteResult.stats.keywordsFound} / ${analysis.keywords.length}</p>
        </div>
        <div class="stat-card">
            <h3>Total Occurrences</h3>
            <p>${mySiteResult.stats.totalOccurrences}</p>
        </div>
        <div class="stat-card">
            <h3>Keyword Density</h3>
            <p>${((mySiteResult.stats.totalOccurrences / mySiteResult.stats.totalWords) * 100).toFixed(2)}%</p>
        </div>
    </div>

    ${analysis.results.map(result => `
        <h2>${result.label}</h2>
        <p><strong>URL:</strong> ${result.url}</p>
        <table>
            <thead>
                <tr>
                    <th>Keyword</th>
                    <th>Found</th>
                    <th>Occurrences</th>
                    <th>Density</th>
                    <th>Locations</th>
                </tr>
            </thead>
            <tbody>
                ${analysis.keywords.map(keyword => {
                    const data = result.keywords[keyword];
                    if (!data.found && result.type !== 'my-site') return '';
                    
                    return `
                        <tr>
                            <td>${escapeHtml(keyword)}</td>
                            <td class="${data.found ? 'found-yes' : 'found-no'}">${data.found ? '✓' : '✗'}</td>
                            <td>${data.found ? data.occurrences : 'NOT FOUND'}</td>
                            <td>${data.found ? data.density + '%' : '-'}</td>
                            <td>${data.found ? data.locations.map(l => `<span class="location-badge">${l.type}</span>`).join(' ') : '-'}</td>
                        </tr>
                    `;
                }).filter(row => row !== '').join('')}
            </tbody>
        </table>
    `).join('')}

    <p style="margin-top: 40px; color: #6c757d; font-size: 14px;">
        Generated by Keyword Tracker Tool - ${new Date().toLocaleString()}
    </p>
</body>
</html>
    `;
}

// History Functions
function renderHistory() {
    const container = document.getElementById('history-list');
    
    if (state.analysisHistory.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <div class="empty-state-text">No analysis history yet. Run your first analysis!</div>
            </div>
        `;
        return;
    }

    container.innerHTML = state.analysisHistory.map(analysis => {
        const date = new Date(analysis.date).toLocaleString();
        const mySiteResult = analysis.results.find(r => r.type === 'my-site');
        const competitorCount = analysis.results.filter(r => r.type === 'competitor').length;
        
        return `
            <div class="history-item" onclick="viewHistoricalAnalysis(${analysis.id})">
                <div class="history-header">
                    <div class="history-date">${date}</div>
                    <button class="btn-secondary" onclick="event.stopPropagation(); deleteHistory(${analysis.id})">Delete</button>
                </div>
                <div class="history-info">
                    <strong>${analysis.groupName}</strong> | 
                    ${analysis.keywords.length} keywords | 
                    ${competitorCount} competitor${competitorCount !== 1 ? 's' : ''} | 
                    ${mySiteResult ? `${mySiteResult.stats.keywordsFound} found` : 'N/A'}
                </div>
            </div>
        `;
    }).join('');
}

function viewHistoricalAnalysis(analysisId) {
    const analysis = state.analysisHistory.find(a => a.id === analysisId);
    if (analysis) {
        state.currentAnalysis = analysis;
        renderResults(analysis);
        switchSection('analysis');
        document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
    }
}

function deleteHistory(analysisId) {
    if (confirm('Are you sure you want to delete this analysis?')) {
        state.analysisHistory = state.analysisHistory.filter(a => a.id !== analysisId);
        saveToLocalStorage();
        renderHistory();
    }
}

// Local Storage Functions
function saveToLocalStorage() {
    try {
        localStorage.setItem('keywordTrackerState', JSON.stringify({
            keywordGroups: state.keywordGroups,
            analysisHistory: state.analysisHistory
        }));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('keywordTrackerState');
        if (saved) {
            const data = JSON.parse(saved);
            state.keywordGroups = data.keywordGroups || [];
            state.analysisHistory = data.analysisHistory || [];
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
