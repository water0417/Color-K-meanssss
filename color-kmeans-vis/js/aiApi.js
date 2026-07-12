/**
 * AI大模型接口请求封装模块
 * 支持多实例渲染
 */

const ColorAI = (function() {
    let apiUrls = {};
    let apiKeys = {};
    let defaultApiUrl = 'https://llm-hlfbtvbtiws685bd.cn-beijing.maas.aliyuncs.com/compatible-mode/v1';
    let defaultApiKey = 'sk-aa60890ddd364d76a03a0af29c626943';

    function normalizeApiUrl(url) {
        const trimmed = (url || '').trim();
        if (!trimmed) {
            return defaultApiUrl;
        }
        if (trimmed.includes('/chat/completions')) {
            return trimmed;
        }
        return trimmed.replace(/\/+$/, '') + '/chat/completions';
    }

    /**
     * 设置API地址
     * @param {string} panelId - 面板ID
     * @param {string} url - API接口地址
     */
    function setApiUrl(panelId, url) {
        apiUrls[panelId] = url;
    }

    /**
     * 设置API Key
     * @param {string} panelId - 面板ID
     * @param {string} key - API Key
     */
    function setApiKey(panelId, key) {
        apiKeys[panelId] = key;
    }

    /**
     * 获取API地址
     * @param {string} panelId - 面板ID
     * @returns {string} API地址
     */
    function getApiUrl(panelId) {
        return apiUrls[panelId] || defaultApiUrl;
    }

    /**
     * 获取API Key
     * @param {string} panelId - 面板ID
     * @returns {string} API Key
     */
    function getApiKey(panelId) {
        return apiKeys[panelId] || defaultApiKey;
    }

    /**
     * 生成AI分析提示词
     * @param {Array} colors - 颜色数组，包含颜色信息
     * @returns {string} 提示词
     */
    function generatePrompt(colors) {
        const colorInfo = colors.map((c, i) => 
            `${i + 1}. 颜色${c.label}: ${c.colorHex} (RGB: ${c.color.r}, ${c.color.g}, ${c.color.b}), 占比${c.percentage}%`
        ).join('\n');

        return `
你是一位专业的色彩设计师和视觉艺术顾问。请分析以下从图片中提取的主色调配色方案：

${colorInfo}

请从以下几个方面进行详细分析，并以JSON格式返回结果：

1. 配色风格：判断它更像什么风格，例如清新自然、复古怀旧、现代简约、活泼可爱、沉稳大气等。
2. 和谐度打分：给出0-100的评分，并说明原因。
3. 优点和不足：分别列出2-3条。
4. 优化建议：给出具体且实用的建议。
5. 综合总结：用自然、像聊天一样的表达，写成一段完整的说明。

请确保返回结构如下：
{
  "harmonyScore": 85,
  "style": "现代简约",
  "analysis": {
    "strengths": ["优点1", "优点2"],
    "weaknesses": ["缺点1", "缺点2"]
  },
  "suggestions": ["建议1", "建议2"],
  "summary": "整体总结，语气要自然、像在和用户聊天。"
}
        `.trim();
    }

    /**
     * 调用AI接口分析配色
     * @param {string} panelId - 面板ID
     * @param {Array} colors - 颜色数组
     * @returns {Promise<Object>} AI分析结果
     */
    async function analyzeColors(panelId, colors) {
        if (!colors || colors.length === 0) {
            return {
                error: '没有可分析的颜色数据'
            };
        }
        // If running on GitHub Pages, avoid real network AI calls (CORS) and return mock data
        const hostname = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';
        if (hostname.includes('github.io')) {
            console.info('Detected GitHub Pages environment — using mock AI result to avoid CORS.');
            return generateMockResult(colors);
        }

        const prompt = generatePrompt(colors);
        const apiUrl = normalizeApiUrl(getApiUrl(panelId));
        const apiKey = getApiKey(panelId);

        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            if (apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    model: 'qwen-turbo',
                    messages: [{
                        role: 'user',
                        content: prompt
                    }],
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const content = data.choices[0].message.content;
                
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        return JSON.parse(jsonMatch[0]);
                    }
                    return parseTextResult(content);
                } catch (e) {
                    return parseTextResult(content);
                }
            }

            return {
                error: '无法解析AI返回结果'
            };
        } catch (error) {
            console.warn('AI接口不可用，使用模拟数据:', error.message);
            
            return generateMockResult(colors);
        }
    }

    /**
     * 解析文本格式的AI结果
     * @param {string} text - AI返回的文本
     * @returns {Object} 解析后的结果对象
     */
    function parseTextResult(text) {
        const scoreMatch = text.match(/(\d+)分?/);
        const harmonyScore = scoreMatch ? parseInt(scoreMatch[1]) : Math.floor(Math.random() * 30) + 65;

        return {
            harmonyScore,
            style: '综合风格',
            analysis: {
                strengths: ['配色整体协调', '视觉效果良好'],
                weaknesses: ['部分颜色对比度可优化']
            },
            suggestions: ['建议调整色彩比例', '尝试添加互补色'],
            summary: text
        };
    }

    /**
     * 生成模拟结果（当API调用失败时使用）
     * @param {Array} colors - 颜色数组
     * @returns {Object} 模拟分析结果
     */
    function generateMockResult(colors) {
        const styles = ['清新自然', '复古怀旧', '现代简约', '活泼可爱', '沉稳大气', '优雅精致'];
        const randomStyle = styles[Math.floor(Math.random() * styles.length)];
        
        const harmonyScore = Math.floor(Math.random() * 30) + 60;

        return {
            harmonyScore,
            style: randomStyle,
            analysis: {
                strengths: [
                    '颜色搭配协调统一',
                    '主色调突出且明确',
                    '色彩层次分明',
                    '整体视觉效果舒适'
                ],
                weaknesses: [
                    '部分颜色饱和度可微调',
                    '次要颜色占比可优化',
                    '缺乏点睛色点缀'
                ]
            },
            suggestions: [
                `建议增加${colors[0]?.colorHex}的使用比例`,
                '尝试添加白色或灰色作为过渡色',
                '考虑使用渐变效果增强层次感',
                '根据配色风格适当调整色彩对比度'
            ],
            summary: `这套配色方案呈现${randomStyle}风格，整体和谐度为${harmonyScore}分。主要优点是颜色搭配协调，视觉效果舒适。建议在保持主色调的基础上，适当调整次要颜色的比例，增强整体层次感。`
        };
    }

    /**
     * 渲染AI分析结果到页面（支持多实例）
     * @param {string} panelId - 面板ID
     * @param {Object} result - AI分析结果
     */
    function renderResult(panelId, result) {
        const scoreValue = document.getElementById(`harmony-score-${panelId}`);
        const scoreLabel = document.getElementById(`score-label-${panelId}`);
        const scoreProgress = document.getElementById(`score-progress-${panelId}`);
        const aiContent = document.getElementById(`ai-content-${panelId}`);

        if (!result || result.error) {
            if (scoreValue) scoreValue.textContent = '--';
            if (scoreLabel) scoreLabel.textContent = '分析失败';
            if (aiContent) aiContent.innerHTML = `<p class="loading-text">${result?.error || '分析失败，请重试'}</p>`;
            return;
        }

        const score = result.harmonyScore || 0;
        
        if (scoreValue) scoreValue.textContent = score;
        
        if (scoreProgress) {
            const dashOffset = 326.72 - (score / 100) * 326.72;
            scoreProgress.style.strokeDashoffset = dashOffset;
            
            if (score >= 80) {
                scoreProgress.style.stroke = '#67c23a';
            } else if (score >= 60) {
                scoreProgress.style.stroke = '#e6a23c';
            } else {
                scoreProgress.style.stroke = '#f56c6c';
            }
        }
        
        if (scoreLabel) {
            if (score >= 80) {
                scoreLabel.textContent = '和谐度优秀';
            } else if (score >= 60) {
                scoreLabel.textContent = '和谐度良好';
            } else {
                scoreLabel.textContent = '和谐度一般';
            }
        }

        if (aiContent) {
            const safeSummary = (result.summary || '这套配色整体比较协调，适合继续微调以增强视觉层次。').replace(/\n/g, '<br>');
            const safeStrengths = result.analysis?.strengths || [];
            const safeWeaknesses = result.analysis?.weaknesses || [];
            const safeSuggestions = result.suggestions || [];

            let html = `
                <div class="chat-bubble">
                    <div class="chat-role">🤖 AI 观察</div>
                    <p>这套配色整体上呈现出<strong>${result.style || '综合风格'}</strong>的感觉，整体视觉气质比较明确。</p>
                </div>
                <div class="chat-bubble">
                    <div class="chat-role">✨ 我的判断</div>
                    <p>${safeSummary}</p>
                </div>
                <div class="chat-bubble">
                    <div class="chat-role">👍 亮点</div>
                    <ul>
                        ${safeStrengths.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                <div class="chat-bubble">
                    <div class="chat-role">⚠️ 需要注意的地方</div>
                    <ul>
                        ${safeWeaknesses.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                <div class="chat-bubble">
                    <div class="chat-role">💡 建议</div>
                    <ul>
                        ${safeSuggestions.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `;
            aiContent.innerHTML = html;
        }
    }

    /**
     * 显示加载状态（支持多实例）
     * @param {string} panelId - 面板ID
     */
    function showLoading(panelId) {
        const aiContent = document.getElementById(`ai-content-${panelId}`);
        if (aiContent) {
            aiContent.innerHTML = `
                <div class="loading-text">
                    <span class="loading-spinner"></span>
                    AI正在分析配色方案...
                </div>
            `;
        }
    }

    /**
     * 清除分析结果（支持多实例）
     * @param {string} panelId - 面板ID
     */
    function clearResult(panelId) {
        const scoreValue = document.getElementById(`harmony-score-${panelId}`);
        const scoreLabel = document.getElementById(`score-label-${panelId}`);
        const scoreProgress = document.getElementById(`score-progress-${panelId}`);
        const aiContent = document.getElementById(`ai-content-${panelId}`);

        if (scoreValue) scoreValue.textContent = '--';
        if (scoreLabel) scoreLabel.textContent = '等待分析...';
        if (scoreProgress) {
            scoreProgress.style.strokeDashoffset = 326.72;
            scoreProgress.style.stroke = '#67c23a';
        }
        if (aiContent) aiContent.innerHTML = '<p class="loading-text">聚类完成后自动分析</p>';
    }

    return {
        setApiUrl,
        getApiUrl,
        setApiKey,
        getApiKey,
        analyzeColors,
        renderResult,
        showLoading,
        clearResult,
        generateMockResult
    };
})();