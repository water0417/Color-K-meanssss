document.addEventListener('DOMContentLoaded', function() {
    let panelCount = 1;
    const panels = {};
    const cachedImages = loadCachedImages();
    let hideDropdownTimer = null;
    let currentUploadPanelId = null;

    const navMenuTrigger = document.getElementById('nav-menu-trigger');
    const navDropdown = document.getElementById('nav-dropdown');

    if (navMenuTrigger && navDropdown) {
        navMenuTrigger.addEventListener('mouseenter', () => {
            if (hideDropdownTimer) {
                clearTimeout(hideDropdownTimer);
                hideDropdownTimer = null;
            }
            navDropdown.style.opacity = '1';
            navDropdown.style.visibility = 'visible';
            navDropdown.style.transform = 'translateY(0)';
            navDropdown.style.maxHeight = '500px';
        });

        navMenuTrigger.addEventListener('mouseleave', () => {
            hideDropdownTimer = setTimeout(() => {
                navDropdown.style.opacity = '0';
                navDropdown.style.visibility = 'hidden';
                navDropdown.style.transform = 'translateY(-10px)';
                navDropdown.style.maxHeight = '0';
            }, 200);
        });

        navDropdown.addEventListener('mouseenter', () => {
            if (hideDropdownTimer) {
                clearTimeout(hideDropdownTimer);
                hideDropdownTimer = null;
            }
        });

        navDropdown.addEventListener('mouseleave', () => {
            hideDropdownTimer = setTimeout(() => {
                navDropdown.style.opacity = '0';
                navDropdown.style.visibility = 'hidden';
                navDropdown.style.transform = 'translateY(-10px)';
                navDropdown.style.maxHeight = '0';
            }, 200);
        });

        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                handleMenuAction(action);
            });
        });

        document.querySelectorAll('.submenu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const subaction = item.dataset.subaction;
                handleSubmenuAction(subaction);
            });
        });

        document.querySelectorAll('.has-submenu').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.classList.add('submenu-open');
            });
            item.addEventListener('mouseleave', () => {
                item.classList.remove('submenu-open');
            });
        });
    }

    function handleMenuAction(action) {
        switch (action) {
            case 'home':
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;
            case 'save':
                break;
            case 'download':
                const panel = document.querySelector('.panel-wrapper');
                if (panel) {
                    const pid = panel.dataset.panelId;
                    const editorContainer = document.getElementById(`color-editor-container-${pid}`);
                    if (editorContainer && editorContainer.style.display !== 'none') {
                        const colors = [];
                        document.querySelectorAll(`#color-editor-grid-${pid} .color-editor-item`).forEach(item => {
                            const colorHex = item.querySelector('.color-preview').style.backgroundColor;
                            const label = item.querySelector('.color-label').textContent;
                            const percentage = item.querySelector('.color-percentage').textContent;
                            colors.push(`${label}: ${colorHex} ${percentage}`);
                        });
                        const blob = new Blob([colors.join('\n')], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.download = `color-scheme-${Date.now()}.txt`;
                        link.href = url;
                        link.click();
                        URL.revokeObjectURL(url);
                    } else {
                        showToast('请先执行聚类分析', 'warning');
                    }
                }
                break;
            case 'new-panel':
                createNewPanel();
                break;
            case 'batch-compare':
                showToast('批量对比功能开发中', 'info');
                break;
            case 'clustering':
                const p = document.querySelector('.panel-wrapper');
                if (p) {
                    const pid = p.dataset.panelId;
                    document.getElementById(`start-cluster-btn-${pid}`).click();
                }
                break;
        }
    }

    function handleSubmenuAction(subaction) {
        const activePanel = document.querySelector('.panel-wrapper');
        if (!activePanel) return;
        const pid = activePanel.dataset.panelId;

        switch (subaction) {
            case 'save-image':
                const canvas = document.getElementById(`preview-canvas-${pid}`);
                if (canvas && canvas.width > 0) {
                    downloadDataUrl(`color-kmeans-image-${Date.now()}.png`, canvas.toDataURL());
                } else {
                    showToast('请先上传图片', 'warning');
                }
                break;
            case 'save-chart':
                const chartDataUrl = window.ColorChart ? ColorChart.getChartDataURL(pid) : null;
                if (chartDataUrl) {
                    downloadDataUrl(`color-kmeans-chart-${Date.now()}.png`, chartDataUrl);
                } else {
                    showToast('请先执行聚类分析', 'warning');
                }
                break;
            case 'save-panel':
                const panelElement = activePanel;
                if (panelElement) {
                    ensureHtml2Canvas(() => {
                        html2canvas(panelElement, { backgroundColor: '#ffffff', logging: false })
                            .then(canvas => {
                                downloadDataUrl(`color-kmeans-panel-${Date.now()}.png`, canvas.toDataURL('image/png'));
                            })
                            .catch(() => {
                                showToast('导出面板失败，请稍后重试', 'error');
                            });
                    });
                }
                break;
        }
    }

    function downloadDataUrl(filename, dataUrl) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function ensureHtml2Canvas(callback) {
        if (window.html2canvas) {
            callback();
            return;
        }

        const scriptId = 'html2canvas-loader';
        if (document.getElementById(scriptId)) {
            document.getElementById(scriptId).addEventListener('load', callback);
            return;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        script.onload = callback;
        script.onerror = () => showToast('无法加载面板导出库，请检查网络', 'error');
        document.head.appendChild(script);
    }

    const colorNames = {
        '#000000': '纯黑', '#ffffff': '纯白', '#808080': '灰色', '#a0a0a0': '浅灰', '#c0c0c0': '银灰',
        '#ff0000': '鲜红', '#c00000': '深红', '#ff6666': '粉红', '#ffcccc': '浅粉', '#ff9999': '玫瑰红',
        '#ff00ff': '洋红', '#c000c0': '紫红', '#ff66ff': '品红', '#ffccff': '淡紫', '#cc66cc': '紫罗兰',
        '#00ff00': '纯绿', '#00c000': '深绿', '#66ff66': '浅绿', '#ccffcc': '薄荷绿', '#90ee90': '苍绿',
        '#008000': '墨绿', '#228b22': '森林绿', '#32cd32': '酸橙绿', '#98fb98': '苍翠绿', '#9acd32': '黄绿',
        '#ffff00': '纯黄', '#c0c000': '深黄', '#ffff66': '浅黄', '#ffffcc': '奶油黄', '#fffacd': '柠檬绸',
        '#ffa500': '橙色', '#ff8c00': '深橙', '#ffb347': '杏黄', '#ffdab9': '桃色', '#ff7f50': '珊瑚橙',
        '#0000ff': '纯蓝', '#0000c0': '深蓝', '#6666ff': '浅蓝', '#ccccff': '淡蓝', '#87ceeb': '天蓝',
        '#0080ff': '亮蓝', '#0080c0': '钢蓝', '#4169e1': '皇家蓝', '#6495ed': '矢车菊蓝', '#87cefa': '浅天蓝',
        '#00ced1': '深青', '#20b2aa': '浅海绿', '#48d1cc': '中青绿', '#afeeee': '淡青色', '#e0ffff': '冰蓝',
        '#008b8b': '暗青', '#5f9ea0': '石板青', '#708090': '石板灰', '#2f4f4f': '暗石板灰', '#778899': '亮石板灰',
        '#8b4513': '马鞍棕', '#a0522d': '赭色', '#cd853f': '秘鲁色', '#d2691e': '巧克力棕', '#daa520': '金菊色',
        '#cd5c5c': '印度红', '#bc8f8f': '玫瑰棕', '#deb887': '原木色', '#f4a460': '沙褐色', '#d2b48c': '棕褐色',
        '#ffc0cb': '粉红', '#ffb6c1': '浅粉红', '#db7093': '桃红', '#ff69b4': '热粉', '#ff1493': '深粉',
        '#7b68ee': '中蓝紫', '#9370db': '梅红紫', '#ba55d3': '中紫', '#dda0dd': '梅红', '#ee82ee': '紫罗兰',
        '#000080': '藏青', '#00008b': '深海军蓝', '#191970': '午夜蓝', '#2f4f4f': '暗石板灰', '#2c3e50': '深蓝灰',
        '#556b2f': '橄榄黄绿', '#6b8e23': '橄榄', '#7cb342': '酸橙绿', '#8bc34a': '嫩绿', '#aed581': '浅黄绿',
        '#e65100': '深橙', '#ff6f00': '琥珀', '#ff8f00': '深琥珀', '#ffb300': '亮琥珀', '#ffca28': '金色',
        '#bf360c': '深橙红', '#d84315': '深橘红', '#e64a19': '橙红', '#ff5722': '深橙色', '#ff7043': '浅橙红',
        '#004d40': '深青色', '#00695c': '青色', '#00796b': '深绿松石', '#00897b': '蓝绿色', '#26a69a': '绿松石',
        '#1a237e': '靛青', '#283593': '深靛青', '#3949ab': '靛青蓝', '#455ede': '亮靛青', '#5c6bc0': '中靛青',
        '#880e4f': '深紫红', '#ad1457': '紫红', '#c2185b': '粉红紫', '#d81b60': '玫瑰红', '#ec407a': '亮粉红',
        '#311b92': '深紫罗兰', '#4a148c': '紫罗兰', '#6a1b9a': '紫', '#7b1fa2': '深紫', '#9c27b0': '亮紫',
        '#1b5e20': '深绿', '#2e7d32': '翠绿', '#388e3c': '绿色', '#43a047': '深翡翠绿', '#4caf50': '翡翠绿',
        '#f57f17': '金色', '#ff8f00': '深琥珀', '#ffaa00': '亮金色', '#ffc107': '琥珀', '#ffd700': '金色'
    };

    const colorPresets = [
        { name: '夏日清新', colors: ['#87CEEB', '#98FB98', '#FFE4E1', '#FFFACD', '#E6E6FA'] },
        { name: '海洋深蓝', colors: ['#000080', '#006994', '#00CED1', '#87CEEB', '#B0E0E6'] },
        { name: '温暖日落', colors: ['#FF6347', '#FFA500', '#FFD700', '#FFB6C1', '#CD853F'] },
        { name: '商务沉稳', colors: ['#2F4F4F', '#4682B4', '#5F9EA0', '#708090', '#778899'] }
    ];

    function getColorName(hex) {
        hex = hex.toLowerCase();
        if (colorNames[hex]) {
            return colorNames[hex];
        }
        const lab = ColorKMeans.rgbToLab(parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16));
        const hsl = ColorKMeans.rgbToHsl(parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16));
        
        let name = '';
        if (hsl.l < 15) name = '深';
        else if (hsl.l > 85) name = '浅';
        else if (hsl.l < 30) name = '暗';
        else if (hsl.l > 70) name = '亮';
        
        if (hsl.s < 20) {
            if (hsl.l < 20) name += '黑';
            else if (hsl.l > 80) name += '白';
            else name += '灰';
        } else {
            if (hsl.h >= 340 || hsl.h < 20) name += '红';
            else if (hsl.h >= 20 && hsl.h < 45) name += '橙';
            else if (hsl.h >= 45 && hsl.h < 75) name += '黄';
            else if (hsl.h >= 75 && hsl.h < 150) name += '绿';
            else if (hsl.h >= 150 && hsl.h < 190) name += '青';
            else if (hsl.h >= 190 && hsl.h < 260) name += '蓝';
            else name += '紫';
        }
        
        return name || '未知色';
    }

    initPanel(0);
    updateCacheSelect(0);

    const createBtn = document.getElementById('create-panel-btn');
    const batchBtn = document.getElementById('batch-compare-btn');
    if (createBtn) {
        createBtn.addEventListener('click', createNewPanel);
    }
    if (batchBtn) {
        batchBtn.addEventListener('click', performBatchCompare);
    }

    function initPanel(panelId) {
        panels[panelId] = {
            images: [],
            currentImageIndex: -1,
            clusterResult: null,
            clusterStats: [],
            scatterData: [],
            originalImageData: null,
            originalClusterResult: null,
            currentColorSpace: 'rgb',
            currentKValue: 5,
            imageHistory: [],
            historyIndex: -1
        };

        ColorChart.initChart(panelId.toString(), `chart-${panelId}`);

        bindPanelEvents(panelId);
    }

    function bindPanelEvents(panelId) {
        const pid = panelId.toString();

        document.getElementById(`image-upload-${pid}`).addEventListener('change', (e) => {
            handleImageUpload(e, panelId);
        });

        const uploadBtn = document.querySelector(`.upload-btn[for="image-upload-${pid}"]`);
        if (uploadBtn) {
            uploadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openUploadModal(panelId);
            });
        }

        const previewContainer = document.getElementById(`image-preview-container-${pid}`);
        if (previewContainer) {
            previewContainer.addEventListener('click', () => {
                openUploadModal(panelId);
            });
        }

        document.getElementById(`prev-img-btn-${pid}`).addEventListener('click', () => {
            showPrevImage(panelId);
        });

        document.getElementById(`next-img-btn-${pid}`).addEventListener('click', () => {
            showNextImage(panelId);
        });

        document.getElementById(`k-value-${pid}`).addEventListener('change', (e) => {
            let val = parseInt(e.target.value);
            if (isNaN(val)) val = 5;
            if (val < 2) val = 2;
            if (val > 20) val = 20;
            e.target.value = val;
            panels[panelId].currentKValue = val;
        });

        document.getElementById(`k-value-${pid}`).addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                performClustering(panelId);
            }
        });

        document.getElementById(`color-space-${pid}`).addEventListener('change', (e) => {
            panels[panelId].currentColorSpace = e.target.value;
            if (panels[panelId].clusterResult) {
                showToast('已切换颜色空间，请重新执行聚类', 'success');
            }
        });

        document.getElementById(`start-cluster-btn-${pid}`).addEventListener('click', () => {
            performClustering(panelId);
        });

        document.getElementById(`bg-color-picker-${pid}`).addEventListener('change', (e) => {
            ColorChart.setBackground(pid, e.target.value);
        });

        document.getElementById(`bg-color-btn-${pid}`).addEventListener('click', (e) => {
            e.stopPropagation();
            const picker = document.getElementById(`bg-color-picker-${pid}`);
            picker.classList.toggle('visible');
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.bg-color-control')) {
                document.querySelectorAll('.color-picker').forEach(p => p.classList.remove('visible'));
            }
        });

        const apiUrlInput = document.getElementById(`ai-api-url-${pid}`);
        const apiKeyInput = document.getElementById(`ai-api-key-${pid}`);

        apiUrlInput?.addEventListener('change', (e) => {
            ColorAI.setApiUrl(pid, e.target.value);
        });

        apiKeyInput?.addEventListener('change', (e) => {
            ColorAI.setApiKey(pid, e.target.value);
        });

        if (apiUrlInput) {
            ColorAI.setApiUrl(pid, apiUrlInput.value);
        }
        if (apiKeyInput) {
            ColorAI.setApiKey(pid, apiKeyInput.value);
        }

        document.getElementById(`apply-migration-btn-${pid}`).addEventListener('click', () => {
            document.getElementById(`migration-file-${pid}`)?.click();
        });

        document.getElementById(`migration-file-${pid}`)?.addEventListener('change', (e) => {
            handleMigrationFileUpload(e, panelId);
        });

        document.getElementById(`restore-original-btn-${pid}`).addEventListener('click', () => {
            restoreOriginalImage(panelId);
        });

        document.getElementById(`undo-btn-${pid}`).addEventListener('click', () => {
            undoImageChange(panelId);
        });

        document.querySelector(`.clear-cache-btn[data-panel-id="${pid}"]`)?.addEventListener('click', () => {
            clearCache();
            updateCacheSelect(panelId);
        });

        document.getElementById(`history-cache-${pid}`).addEventListener('change', (e) => {
            handleCacheSelect(e, panelId);
        });

        document.getElementById(`chart-type-${pid}`).addEventListener('change', (e) => {
            const chartType = e.target.value;
            ColorChart.switchChart(pid, chartType, panels[panelId].scatterData);
        });

        document.querySelector(`.remove-panel-btn[data-panel-id="${pid}"]`)?.addEventListener('click', () => {
            removePanel(panelId);
        });
    }

    function handleImageUpload(e, panelId) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const panel = panels[panelId];

        for (const file of files) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const imageData = {
                        file: file,
                        url: event.target.result,
                        name: file.name
                    };
                    panel.images.push(imageData);
                    
                    cacheImage(imageData);
                    
                    if (panel.images.length === 1) {
                        showImage(panelId, 0);
                    }
                    updateImageSwitcher(panelId);
                    updateCacheSelect(panelId);
                    updateMigrationSources();
                };
                reader.readAsDataURL(file);
            }
        }

        e.target.value = '';
    }

    function showImage(panelId, index) {
        const panel = panels[panelId];
        if (index < 0 || index >= panel.images.length) return;

        panel.currentImageIndex = index;
        const imageData = panel.images[index];

        const previewCanvas = document.getElementById(`preview-canvas-${panelId}`);
        const canvasPlaceholder = document.getElementById(`canvas-placeholder-${panelId}`);
        const container = previewCanvas.parentElement;

        const ctx = previewCanvas.getContext('2d');

        // If this image has a modifiedDataUrl (canvas-modified), prefer that
        if (imageData.modifiedDataUrl) {
            const img = new Image();
            img.onload = function() {
                const maxWidth = container.clientWidth;
                const maxHeight = 400;

                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = (maxHeight / height) * width;
                    height = maxHeight;
                }

                previewCanvas.width = width;
                previewCanvas.height = height;
                previewCanvas.style.width = width + 'px';
                previewCanvas.style.height = height + 'px';

                container.style.minHeight = height + 'px';
                container.style.height = height + 'px';

                ctx.clearRect(0,0,previewCanvas.width, previewCanvas.height);
                ctx.drawImage(img, 0, 0, width, height);

                const savedImageData = ctx.getImageData(0, 0, width, height);
                panel.originalImageData = savedImageData;

                imageData.original = imageData.original || savedImageData;
                imageData.width = width;
                imageData.height = height;

                previewCanvas.style.display = 'block';
                canvasPlaceholder.style.display = 'none';

                saveToHistory(panelId, savedImageData);

                ColorChart.clearChart(panelId.toString());
                ColorAI.clearResult(panelId.toString());
                panel.clusterResult = null;
                panel.clusterStats = [];
                panel.scatterData = [];
                hideColorEditor(panelId);
                hideColorSchemePreview(panelId);
                hideColorPresets(panelId);
            };
            img.src = imageData.modifiedDataUrl;
            return;
        }

        // Fallback: draw original image URL
        const img = new Image();
        img.onload = function() {
            const maxWidth = container.clientWidth;
            const maxHeight = 400;

            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (maxHeight / height) * width;
                height = maxHeight;
            }

            previewCanvas.width = width;
            previewCanvas.height = height;
            previewCanvas.style.width = width + 'px';
            previewCanvas.style.height = height + 'px';

            container.style.minHeight = height + 'px';
            container.style.height = height + 'px';

            ctx.clearRect(0,0,previewCanvas.width, previewCanvas.height);
            ctx.drawImage(img, 0, 0, width, height);

            const originalImageData = ctx.getImageData(0, 0, width, height);
            panel.originalImageData = originalImageData;
            panel.originalClusterResult = null;

            imageData.original = originalImageData;
            imageData.width = width;
            imageData.height = height;
            imageData.modified = imageData.modified || null;

            previewCanvas.style.display = 'block';
            canvasPlaceholder.style.display = 'none';

            saveToHistory(panelId, originalImageData);

            ColorChart.clearChart(panelId.toString());
            ColorAI.clearResult(panelId.toString());
            panel.clusterResult = null;
            panel.clusterStats = [];
            panel.scatterData = [];
            hideColorEditor(panelId);
            hideColorSchemePreview(panelId);
            hideColorPresets(panelId);
        };
        img.src = imageData.url;
    }

    function saveToHistory(panelId, imageData) {
        const panel = panels[panelId];
        const dataUrl = getImageDataUrl(imageData);
        
        panel.imageHistory = panel.imageHistory.slice(0, panel.historyIndex + 1);
        panel.imageHistory.push(dataUrl);
        panel.historyIndex = panel.imageHistory.length - 1;
        
        updateUndoButton(panelId);
    }

    function getImageDataUrl(imageData) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imageData.width;
        tempCanvas.height = imageData.height;
        const ctx = tempCanvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
        return tempCanvas.toDataURL();
    }

    function updateUndoButton(panelId) {
        const panel = panels[panelId];
        const undoBtn = document.getElementById(`undo-btn-${panelId}`);
        if (undoBtn) {
            undoBtn.disabled = panel.historyIndex <= 0;
        }
    }

    function showPrevImage(panelId) {
        const panel = panels[panelId];
        if (panel.currentImageIndex > 0) {
            showImage(panelId, panel.currentImageIndex - 1);
            updateImageSwitcher(panelId);
        }
    }

    function showNextImage(panelId) {
        const panel = panels[panelId];
        if (panel.currentImageIndex < panel.images.length - 1) {
            showImage(panelId, panel.currentImageIndex + 1);
            updateImageSwitcher(panelId);
        }
    }

    function updateImageSwitcher(panelId) {
        const panel = panels[panelId];
        const counter = document.getElementById(`image-counter-${panelId}`);
        const prevBtn = document.getElementById(`prev-img-btn-${panelId}`);
        const nextBtn = document.getElementById(`next-img-btn-${panelId}`);

        counter.textContent = `${panel.currentImageIndex + 1} / ${panel.images.length}`;
        prevBtn.disabled = panel.currentImageIndex <= 0;
        nextBtn.disabled = panel.currentImageIndex >= panel.images.length - 1;
    }

    function performClustering(panelId) {
        const panel = panels[panelId];
        const previewCanvas = document.getElementById(`preview-canvas-${panelId}`);
        
        if (panel.currentImageIndex < 0 || !previewCanvas.getContext) {
            showToast('请先上传图片', 'error');
            return;
        }

        const k = parseInt(document.getElementById(`k-value-${panelId}`).value);
        const colorSpace = document.getElementById(`color-space-${panelId}`).value;

        if (isNaN(k) || k < 2 || k > 20) {
            showToast('K值必须在2-20之间', 'error');
            return;
        }

        const clusterBtn = document.getElementById(`start-cluster-btn-${panelId}`);
        clusterBtn.disabled = true;
        clusterBtn.innerHTML = '<span class="loading-spinner"></span> 聚类中...';

        setTimeout(() => {
            try {
                const pixels = ColorKMeans.getPixelsFromCanvas(previewCanvas);
                
                if (pixels.length === 0) {
                    showToast('无法读取图片像素数据', 'error');
                    clusterBtn.disabled = false;
                    clusterBtn.innerHTML = '<span class="btn-icon">🚀</span> 聚类';
                    return;
                }

                panel.clusterResult = ColorKMeans.kmeans(pixels, k, colorSpace);
                panel.clusterStats = ColorKMeans.getClusterStats(panel.clusterResult);
                panel.scatterData = ColorKMeans.getLabScatterData(panel.clusterResult.clusters, panel.clusterResult.centroids);
                panel.currentKValue = k;
                panel.currentColorSpace = colorSpace;

                panel.clusterStats.forEach((stat) => {
                    stat.colorName = getColorName(stat.colorHex);
                    stat.displayLabel = stat.colorName;
                });

                panel.scatterData = reorderScatterDataByClusterStats(panel);

                panel.originalClusterResult = JSON.parse(JSON.stringify(panel.clusterResult));

                document.getElementById(`total-pixels-${panelId}`).textContent = panel.clusterResult.totalPixels.toLocaleString();
                document.getElementById(`cluster-count-${panelId}`).textContent = panel.clusterStats.length;

                ColorChart.updateChart(panelId.toString(), panel.clusterStats, panel.scatterData);
                showColorEditor(panelId);
                showColorSchemePreview(panelId);
                showColorPresets(panelId);

                showToast(`聚类完成！共迭代${panel.clusterResult.iterations}次`, 'success');

                setTimeout(() => {
                    performAIAnalysis(panelId);
                }, 500);
            } catch (error) {
                console.error('聚类失败:', error);
                showToast('聚类过程中发生错误', 'error');
            } finally {
                clusterBtn.disabled = false;
                clusterBtn.innerHTML = ' 聚类';
            }
        }, 100);
    }

    function reorderScatterDataByClusterStats(panel) {
        if (!panel || !Array.isArray(panel.clusterStats) || !Array.isArray(panel.scatterData)) {
            return panel.scatterData || [];
        }

        const statsByIndex = panel.clusterStats.reduce((map, stat) => {
            if (typeof stat.originalIndex === 'number') {
                map[stat.originalIndex] = stat;
            }
            return map;
        }, {});

        const reordered = panel.scatterData
            .map(series => {
                const index = typeof series.originalIndex === 'number' ? series.originalIndex : null;
                const stat = index !== null ? statsByIndex[index] : null;
                return {
                    ...series,
                    displayLabel: stat ? stat.colorName : series.displayLabel,
                    name: series.name || (stat ? stat.label : series.name)
                };
            })
            .sort((a, b) => {
                const aIndex = typeof a.originalIndex === 'number' ? a.originalIndex : -1;
                const bIndex = typeof b.originalIndex === 'number' ? b.originalIndex : -1;
                return aIndex - bIndex;
            });

        return reordered;
    }

    async function performAIAnalysis(panelId) {
        const panel = panels[panelId];
        if (!panel.clusterStats || panel.clusterStats.length === 0) {
            return;
        }

        const apiUrlInput = document.getElementById(`ai-api-url-${panelId}`);
        const apiKeyInput = document.getElementById(`ai-api-key-${panelId}`);
        const apiUrl = (apiUrlInput?.value || '').trim();
        const apiKey = (apiKeyInput?.value || '').trim();

        if (apiUrl) {
            ColorAI.setApiUrl(panelId.toString(), apiUrl);
        }
        if (apiKey) {
            ColorAI.setApiKey(panelId.toString(), apiKey);
        }

        if (!apiUrl) {
            ColorAI.setApiUrl(panelId.toString(), 'https://llm-hlfbtvbtiws685bd.cn-beijing.maas.aliyuncs.com/compatible-mode/v1');
            ColorAI.setApiKey(panelId.toString(), 'sk-aa60890ddd364d76a03a0af29c626943');
        }
        
        ColorAI.showLoading(panelId.toString());

        try {
            const result = await ColorAI.analyzeColors(panelId.toString(), panel.clusterStats);
            ColorAI.renderResult(panelId.toString(), result);
        } catch (error) {
            console.error('AI分析失败:', error);
            const mockResult = ColorAI.generateMockResult(panel.clusterStats);
            ColorAI.renderResult(panelId.toString(), mockResult);
        }
    }

    function showColorEditor(panelId) {
        const panel = panels[panelId];
        const editorContainer = document.getElementById(`color-editor-container-${panelId}`);
        const editorGrid = document.getElementById(`color-editor-grid-${panelId}`);
        
        if (!panel.clusterStats || panel.clusterStats.length === 0) {
            editorContainer.style.display = 'none';
            return;
        }

        editorContainer.style.display = 'block';
        editorGrid.innerHTML = '';

        panel.clusterStats.forEach((stat, index) => {
            const item = document.createElement('div');
            item.className = 'color-editor-item';
            item.innerHTML = `
                <div class="color-preview" style="background-color: ${stat.colorHex};" id="color-preview-${panelId}-${index}"></div>
                <input type="color" class="color-picker-input" id="color-picker-${panelId}-${index}" value="${stat.colorHex}">
                <div class="color-info">
                    <div>${stat.colorName} <span style="color: #888;">${stat.colorHex}</span></div>
                    <div>${stat.pixelCount.toLocaleString()} 像素</div>
                </div>
            `;
            editorGrid.appendChild(item);

            const preview = document.getElementById(`color-preview-${panelId}-${index}`);
            const picker = document.getElementById(`color-picker-${panelId}-${index}`);

            preview.addEventListener('click', () => {
                picker.click();
            });

            picker.addEventListener('change', (e) => {
                const newColor = ColorKMeans.hexToRgb(e.target.value);
                if (newColor) {
                    preview.style.backgroundColor = e.target.value;
                    updateClusterColor(panelId, index, newColor);
                }
            });
        });
    }

    function hideColorEditor(panelId) {
        const editorContainer = document.getElementById(`color-editor-container-${panelId}`);
        if (editorContainer) {
            editorContainer.style.display = 'none';
        }
    }

    function showColorSchemePreview(panelId) {
        const panel = panels[panelId];
        const previewContainer = document.getElementById(`color-scheme-preview-${panelId}`);
        
        if (!previewContainer) {
            return;
        }
        
        const swatchGrid = document.getElementById(`color-swatch-grid-${panelId}`);
        
        if (!panel.clusterStats || panel.clusterStats.length === 0) {
            previewContainer.style.display = 'none';
            return;
        }

        previewContainer.style.display = 'block';
        swatchGrid.innerHTML = '';

        panel.clusterStats.forEach((stat, index) => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch-item';
            swatch.dataset.index = index;
            
            const colorDot = document.createElement('div');
            colorDot.className = 'color-dot';
            colorDot.style.backgroundColor = stat.colorHex;
            
            const infoSpan = document.createElement('span');
            infoSpan.className = 'color-info-text';
            infoSpan.textContent = `${stat.colorName} ${stat.percentage.toFixed(1)}%`;
            
            swatch.appendChild(colorDot);
            swatch.appendChild(infoSpan);
            
            swatch.addEventListener('click', () => {
                document.querySelectorAll(`.color-swatch-item`).forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
            });
            
            swatchGrid.appendChild(swatch);
        });
    }

    function hideColorSchemePreview(panelId) {
        const previewContainer = document.getElementById(`color-scheme-preview-${panelId}`);
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
    }

    function showColorPresets(panelId) {
        const panel = panels[panelId];
        const presetContainer = document.getElementById(`color-presets-${panelId}`);
        const presetGrid = document.getElementById(`preset-swatch-grid-${panelId}`);
        const presetTitle = document.getElementById(`presets-title-${panelId}`);
        
        if (!panel.clusterStats || panel.clusterStats.length === 0) {
            if (presetContainer) presetContainer.style.display = 'none';
            if (presetTitle) presetTitle.style.display = 'none';
            return;
        }

        if (presetTitle) presetTitle.style.display = 'block';
        presetContainer.style.display = 'block';
        presetGrid.innerHTML = '';

        const k = panel.clusterStats.length;

        colorPresets.forEach((preset, presetIndex) => {
            const presetDiv = document.createElement('div');
            presetDiv.className = 'preset-item';
            presetDiv.dataset.presetIndex = presetIndex;
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'preset-name';
            nameSpan.textContent = preset.name;
            presetDiv.appendChild(nameSpan);

            const swatchRow = document.createElement('div');
            swatchRow.className = 'preset-swatch-row';
            
            const presetColors = preset.colors.slice(0, k);
            
            presetColors.forEach((color) => {
                const swatch = document.createElement('div');
                swatch.className = 'preset-swatch';
                swatch.style.backgroundColor = color;
                swatch.title = `${getColorName(color)}`;
                swatchRow.appendChild(swatch);
            });
            
            presetDiv.appendChild(swatchRow);
            
            presetDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                applyColorPreset(panelId, presetColors);
            });
            
            presetGrid.appendChild(presetDiv);
        });
    }

    function hideColorPresets(panelId) {
        const presetContainer = document.getElementById(`color-presets-${panelId}`);
        const presetTitle = document.getElementById(`presets-title-${panelId}`);
        if (presetContainer) {
            presetContainer.style.display = 'none';
        }
        if (presetTitle) {
            presetTitle.style.display = 'none';
        }
    }

    function applyColorPreset(panelId, presetColors) {
        const panel = panels[panelId];
        if (!panel.clusterStats || panel.clusterStats.length === 0) return;

        const previewCanvas = document.getElementById(`preview-canvas-${panelId}`);
        const ctx = previewCanvas.getContext('2d');
        
        panel.clusterStats.forEach((stat, index) => {
            if (index < presetColors.length) {
                const newColor = ColorKMeans.hexToRgb(presetColors[index]);
                if (newColor) {
                    const imageData = ColorKMeans.recolorImage(previewCanvas, panel.clusterResult.centroids, index, newColor, panel.currentColorSpace);
                    ctx.putImageData(imageData, 0, 0);
                    
                    panel.clusterResult.centroids[index] = newColor;
                    stat.color = newColor;
                    stat.colorHex = presetColors[index];
                    stat.colorName = getColorName(presetColors[index]);
                    stat.displayLabel = stat.colorName;
                }
            }
        });

        saveToHistory(panelId, ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height));

        // store modified image data URL for this image
        if (panel.currentImageIndex >= 0 && panel.images[panel.currentImageIndex]) {
            const imgObj = panel.images[panel.currentImageIndex];
            const imgData = ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
            imgObj.modified = imgData;
            imgObj.modifiedDataUrl = previewCanvas.toDataURL();
        }

        ColorChart.updateChart(panelId.toString(), panel.clusterStats, panel.scatterData);
        showColorEditor(panelId);
        showColorSchemePreview(panelId);

        setTimeout(() => {
            performAIAnalysis(panelId);
        }, 300);
        
        showToast('配色预设已应用', 'success');
    }

    function restoreOriginalImage(panelId) {
        const panel = panels[panelId];
        const previewCanvas = document.getElementById(`preview-canvas-${panelId}`);
        
        if (!panel.originalImageData || !previewCanvas.getContext) return;

        const ctx = previewCanvas.getContext('2d');
        ctx.putImageData(panel.originalImageData, 0, 0);

        saveToHistory(panelId, panel.originalImageData);

        // clear any modified data for current image so UI shows original
        if (panel.currentImageIndex >= 0 && panel.images[panel.currentImageIndex]) {
            panel.images[panel.currentImageIndex].modified = null;
            panel.images[panel.currentImageIndex].modifiedDataUrl = null;
        }

        if (panel.originalClusterResult) {
            panel.clusterResult = JSON.parse(JSON.stringify(panel.originalClusterResult));
            panel.clusterStats = ColorKMeans.getClusterStats(panel.clusterResult);
            panel.scatterData = ColorKMeans.getLabScatterData(panel.clusterResult.clusters, panel.clusterResult.centroids);
            
            panel.clusterStats.forEach((stat) => {
                stat.colorName = getColorName(stat.colorHex);
                stat.displayLabel = stat.colorName;
            });

            panel.scatterData = reorderScatterDataByClusterStats(panel);

            document.getElementById(`total-pixels-${panelId}`).textContent = panel.clusterResult.totalPixels.toLocaleString();
            document.getElementById(`cluster-count-${panelId}`).textContent = panel.clusterStats.length;

            ColorChart.updateChart(panelId.toString(), panel.clusterStats, panel.scatterData);
            showColorEditor(panelId);
            showColorSchemePreview(panelId);
            showColorPresets(panelId);
        } else {
            panel.clusterResult = null;
            panel.clusterStats = [];
            panel.scatterData = [];
            
            ColorChart.clearChart(panelId.toString());
            ColorAI.clearResult(panelId.toString());
            hideColorEditor(panelId);
            hideColorSchemePreview(panelId);
            hideColorPresets(panelId);
        }
        
        showToast('已恢复原始图片', 'success');
    }

    function undoImageChange(panelId) {
        const panel = panels[panelId];
        const previewCanvas = document.getElementById(`preview-canvas-${panelId}`);
        
        if (panel.historyIndex <= 0 || !previewCanvas.getContext) return;

        panel.historyIndex--;
        const prevDataUrl = panel.imageHistory[panel.historyIndex];
        
        const img = new Image();
        img.onload = function() {
            const ctx = previewCanvas.getContext('2d');
            ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
            ctx.drawImage(img, 0, 0);
            updateUndoButton(panelId);
        };
        img.src = prevDataUrl;
        // set the current image's modifiedDataUrl to the restored data
        if (panel.currentImageIndex >= 0 && panel.images[panel.currentImageIndex]) {
            panel.images[panel.currentImageIndex].modifiedDataUrl = prevDataUrl;
        }
        
        // After restoring the previous canvas image, clear clustering and AI state
        panel.clusterResult = null;
        panel.clusterStats = [];
        panel.scatterData = [];
        panel.currentKValue = null;

        ColorChart.clearChart(panelId.toString());
        ColorAI.clearResult(panelId.toString());
        hideColorEditor(panelId);
        hideColorSchemePreview(panelId);
        hideColorPresets(panelId);

        document.getElementById(`total-pixels-${panelId}`).textContent = '0';
        document.getElementById(`cluster-count-${panelId}`).textContent = '0';

        showToast('已撤销上一步操作，聚类和AI结果已清除', 'success');
    }

    function updateClusterColor(panelId, clusterIndex, newColor) {
        const panel = panels[panelId];
        const previewCanvas = document.getElementById(`preview-canvas-${panelId}`);
        
        if (!panel.clusterResult || !previewCanvas.getContext) return;

        const ctx = previewCanvas.getContext('2d');
        const imageData = ColorKMeans.recolorImage(previewCanvas, panel.clusterResult.centroids, clusterIndex, newColor, panel.currentColorSpace);
        ctx.putImageData(imageData, 0, 0);

        saveToHistory(panelId, imageData);

        // store modified image and data url
        if (panel.currentImageIndex >= 0 && panel.images[panel.currentImageIndex]) {
            const imgObj = panel.images[panel.currentImageIndex];
            imgObj.modified = imageData;
            imgObj.modifiedDataUrl = previewCanvas.toDataURL();
        }

        panel.clusterResult.centroids[clusterIndex] = newColor;
        panel.clusterStats[clusterIndex].color = newColor;
        panel.clusterStats[clusterIndex].colorHex = ColorKMeans.rgbToHex(newColor.r, newColor.g, newColor.b);
        panel.clusterStats[clusterIndex].colorName = getColorName(panel.clusterStats[clusterIndex].colorHex);
        panel.clusterStats[clusterIndex].displayLabel = panel.clusterStats[clusterIndex].colorName;
        panel.scatterData = reorderScatterDataByClusterStats(panel);

        ColorChart.updateChart(panelId.toString(), panel.clusterStats, panel.scatterData);
        showColorSchemePreview(panelId);

        setTimeout(() => {
            performAIAnalysis(panelId);
        }, 300);
    }

    function createNewPanel() {
        const newPanelId = panelCount++;
        const container = document.getElementById('panels-container');
        
        const panelWrapper = document.createElement('div');
        panelWrapper.className = 'panel-wrapper';
        panelWrapper.dataset.panelId = newPanelId;
        
        panelWrapper.innerHTML = `
            <div class="panel-header">
                <span class="panel-title">分析面板 ${panelCount}</span>
                <div class="panel-header-actions">
                    <div class="cache-select-container">
                        <label for="history-cache-${newPanelId}">📂 历史:</label>
                        <select id="history-cache-${newPanelId}">
                            <option value="">选择历史图片...</option>
                        </select>
                        <button class="clear-cache-btn" data-panel-id="${newPanelId}">🗑️</button>
                    </div>
                    <button class="remove-panel-btn" data-panel-id="${newPanelId}">✕</button>
                </div>
            </div>
            <main class="three-column-layout">
                <section class="column-left">
                    <div class="card">
                        <div class="left-fixed-top">
                            <div class="upload-container">
                                <label for="image-upload-${newPanelId}" class="upload-btn">
                                    选择图片
                                </label>
                                <input type="file" id="image-upload-${newPanelId}" accept="image/*" multiple>
                            </div>
                            <div class="image-preview-container" id="image-preview-container-${newPanelId}">
                                <canvas id="preview-canvas-${newPanelId}"></canvas>
                                <div class="canvas-placeholder" id="canvas-placeholder-${newPanelId}">
                                    <span class="placeholder-icon">🖼️</span>
                                    <p>点击此处或上方按钮上传图片</p>
                                </div>
                            </div>
                            <div class="image-switcher" id="image-switcher-${newPanelId}">
                                <button class="switch-btn" id="prev-img-btn-${newPanelId}">⬅️</button>
                                <span class="image-counter" id="image-counter-${newPanelId}">0 / 0</span>
                                <button class="switch-btn" id="next-img-btn-${newPanelId}">➡️</button>
                            </div>
                        </div>

                        <div class="left-scroll-middle">
                            <h3 class="presets-title" id="presets-title-${newPanelId}" style="display: none;">🎨 配色预设</h3>
                            <div class="color-presets-container custom-scrollbar" id="color-presets-${newPanelId}" style="display: none;">
                                <div class="preset-swatch-grid" id="preset-swatch-grid-${newPanelId}"></div>
                            </div>
                        </div>

                        <div class="left-fixed-bottom">
                            <div class="color-migration-container">
                                <label for="migration-source-${newPanelId}">🎨 配色迁移:</label>
                                <button class="migration-btn" id="apply-migration-btn-${newPanelId}">选择图片迁移配色</button>
                                <input type="file" id="migration-file-${newPanelId}" accept="image/*" style="display: none;">
                            </div>
                            <div class="image-actions">
                                <button class="action-btn secondary-btn" id="restore-original-btn-${newPanelId}">🔄 恢复原图</button>
                                <button class="action-btn secondary-btn" id="undo-btn-${newPanelId}" disabled>↩️ 撤销</button>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="column-center">
                    <div class="card">
                        <div class="chart-controls">
                            <div class="control-group-inline">
                                <label for="k-value-${newPanelId}">K:</label>
                                <input type="number" id="k-value-${newPanelId}" value="5" min="2" max="20" step="1">
                            </div>
                            <div class="control-group-inline">
                                <label for="color-space-${newPanelId}">空间:</label>
                                <select id="color-space-${newPanelId}">
                                    <option value="rgb">RGB</option>
                                    <option value="lab">LAB</option>
                                    <option value="hsl">HSL</option>
                                    <option value="cmyk">CMYK</option>
                                </select>
                            </div>
                            <div class="control-group-inline">
                                <label for="chart-type-${newPanelId}">图表:</label>
                                <select id="chart-type-${newPanelId}">
                                    <option value="pie">饼图</option>
                                    <option value="bar">柱状图</option>
                                    <option value="rose">玫瑰图</option>
                                    <option value="scatter">散点</option>
                                </select>
                            </div>
                            <button class="action-btn cluster-btn" id="start-cluster-btn-${newPanelId}">
                                聚类
                            </button>
                        </div>
                        
                        <div class="chart-container" id="chart-container-${newPanelId}">
                            <div id="chart-${newPanelId}"></div>
                            <div class="chart-placeholder" id="chart-placeholder-${newPanelId}">
                                <span class="placeholder-icon">📈</span>
                                <p>请先上传图片并执行聚类</p>
                            </div>
                            <div class="bg-color-control" id="bg-color-control-${newPanelId}">
                                <button class="bg-color-btn" id="bg-color-btn-${newPanelId}" title="选择图表背景色">🎨</button>
                                <input type="color" id="bg-color-picker-${newPanelId}" value="#f5f7fa" class="color-picker">
                            </div>
                        </div>

                        <div class="chart-info" id="chart-info-${newPanelId}">
                            <p>共检测到 <span id="total-pixels-${newPanelId}">0</span> 个像素</p>
                            <p>聚类数量: <span id="cluster-count-${newPanelId}">0</span></p>
                        </div>

                        <div class="color-editor-container" id="color-editor-container-${newPanelId}" style="display: none;">
                            <h3>🎨 颜色编辑</h3>
                            <div class="color-editor-grid" id="color-editor-grid-${newPanelId}"></div>
                        </div>
                    </div>
                </section>

                <section class="column-right">
                    <div class="card">
                        <div class="right-fixed-top">
                            <h2>🤖 AI配色分析区</h2>
                            <div class="score-container" id="score-container-${newPanelId}">
                                <div class="score-ring">
                                    <svg viewBox="0 0 120 120" class="score-svg">
                                        <circle class="score-bg" cx="60" cy="60" r="52" fill="none" stroke="#e0e0e0" stroke-width="8"/>
                                        <circle class="score-progress" id="score-progress-${newPanelId}" cx="60" cy="60" r="52" fill="none" stroke="#67c23a" stroke-width="8" stroke-linecap="round" stroke-dasharray="326.72" stroke-dashoffset="326.72"/>
                                    </svg>
                                    <div class="score-text">
                                        <span class="score-value" id="harmony-score-${newPanelId}">--</span>
                                        <span class="score-unit">分</span>
                                    </div>
                                </div>
                                <div class="score-label" id="score-label-${newPanelId}">等待分析...</div>
                            </div>
                        </div>

                        <div class="right-scroll-middle">
                            <div class="ai-text-container" id="ai-text-container-${newPanelId}">
                                <h3>📝 配色分析报告</h3>
                                <div class="ai-content custom-scrollbar" id="ai-content-${newPanelId}">
                                    <p class="loading-text">聚类完成后自动分析</p>
                                </div>
                            </div>
                        </div>

                        <div class="right-fixed-bottom">
                            <div class="api-config">
                                <label for="ai-api-url-${newPanelId}">AI接口地址:</label>
                                <input type="text" id="ai-api-url-${newPanelId}" placeholder="https://llm-hlfbtvbtiws685bd.cn-beijing.maas.aliyuncs.com/compatible-mode/v1" value="https://llm-hlfbtvbtiws685bd.cn-beijing.maas.aliyuncs.com/compatible-mode/v1">
                            </div>
                            <div class="api-config">
                                <label for="ai-api-key-${newPanelId}">API Key:</label>
                                <input type="password" id="ai-api-key-${newPanelId}" placeholder="留空使用默认配置" autocomplete="off" value="sk-aa60890ddd364d76a03a0af29c626943">
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        `;

        container.appendChild(panelWrapper);
        initPanel(newPanelId);
        updateCacheSelect(newPanelId);
        updateMigrationSources();

        setTimeout(() => {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);

        showToast('新建对比面板成功', 'success');
    }

    function removePanel(panelId) {
        if (Object.keys(panels).length <= 1) {
            showToast('至少保留一个分析面板', 'error');
            return;
        }

        ColorChart.destroyChart(panelId.toString());
        const panelWrapper = document.querySelector(`.panel-wrapper[data-panel-id="${panelId}"]`);
        if (panelWrapper) {
            panelWrapper.remove();
        }
        delete panels[panelId];
        updateMigrationSources();
        showToast('面板已删除', 'success');
    }

    function loadCachedImages() {
        try {
            const stored = localStorage.getItem('colorKmeansCache');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('加载缓存失败:', e);
            return [];
        }
    }

    function saveCachedImages(images) {
        try {
            localStorage.setItem('colorKmeansCache', JSON.stringify(images));
        } catch (e) {
            console.error('保存缓存失败:', e);
            if (images.length > 0) {
                saveCachedImages(images.slice(0, Math.floor(images.length / 2)));
            }
        }
    }

    function cacheImage(imageData) {
        const exists = cachedImages.some(img => img.url === imageData.url);
        if (!exists) {
            cachedImages.push({
                name: imageData.name,
                url: imageData.url
            });
            if (cachedImages.length > 20) {
                cachedImages.shift();
            }
            saveCachedImages(cachedImages);
        }
    }

    function updateCacheSelect(panelId) {
        const select = document.getElementById(`history-cache-${panelId}`);
        if (!select) return;
        
        select.innerHTML = '<option value="">选择历史图片...</option>';
        
        cachedImages.forEach((img, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = img.name;
            select.appendChild(option);
        });
    }

    function handleCacheSelect(e, panelId) {
        const index = parseInt(e.target.value);
        if (isNaN(index) || index < 0 || index >= cachedImages.length) return;

        const imgData = cachedImages[index];
        
        const panel = panels[panelId];
        const exists = panel.images.some(img => img.url === imgData.url);
        
        if (!exists) {
            panel.images.push({
                file: null,
                url: imgData.url,
                name: imgData.name
            });
        }
        
        const localIndex = panel.images.findIndex(img => img.url === imgData.url);
        showImage(panelId, localIndex);
        updateImageSwitcher(panelId);
    }

    function clearCache() {
        if (confirm('确定要清空所有历史缓存图片吗？')) {
            localStorage.removeItem('colorKmeansCache');
            cachedImages.length = 0;
            Object.keys(panels).forEach(panelId => {
                updateCacheSelect(panelId);
            });
            showToast('缓存已清空', 'success');
        }
    }

    function updateMigrationSources() {
        Object.keys(panels).forEach(panelId => {
            const panel = panels[panelId];
            const select = document.getElementById(`migration-source-${panelId}`);
            
            if (!select) return;

            select.innerHTML = '<option value="">选择源配色...</option>';
            
            Object.keys(panels).forEach(sourceId => {
                if (sourceId !== panelId && panels[sourceId].clusterResult) {
                    const sourcePanel = panels[sourceId];
                    const option = document.createElement('option');
                    option.value = sourceId;
                    option.textContent = `面板${parseInt(sourceId) + 1} (${sourcePanel.clusterStats.length}色)`;
                    select.appendChild(option);
                }
            });
        });
    }

    function applyColorMigration(targetPanelId) {
        const targetPanel = panels[targetPanelId];
        const sourcePanelId = document.getElementById(`migration-source-${targetPanelId}`).value;
        
        if (!sourcePanelId) {
            showToast('请选择源配色', 'error');
            return;
        }

        const sourcePanel = panels[sourcePanelId];
        if (!sourcePanel.clusterResult) {
            showToast('源面板需要先执行聚类', 'error');
            return;
        }

        if (targetPanel.currentImageIndex < 0) {
            showToast('目标面板需要先上传图片', 'error');
            return;
        }

        const previewCanvas = document.getElementById(`preview-canvas-${targetPanelId}`);
        const ctx = previewCanvas.getContext('2d');
        
        const sourceCentroids = sourcePanel.clusterResult.centroids;
        
        if (!targetPanel.clusterResult) {
            performClustering(targetPanelId);
            setTimeout(() => {
                applyColorMigrationAfterCluster(targetPanelId, sourceCentroids);
            }, 500);
            return;
        }

        applyColorMigrationAfterCluster(targetPanelId, sourceCentroids);
    }

    function applyColorMigrationAfterCluster(targetPanelId, sourceCentroids) {
        const targetPanel = panels[targetPanelId];
        const previewCanvas = document.getElementById(`preview-canvas-${targetPanelId}`);
        const ctx = previewCanvas.getContext('2d');
        
        const targetCentroids = targetPanel.clusterResult.centroids;

        const imageData = ColorKMeans.migrateColors(previewCanvas, targetCentroids, sourceCentroids, targetPanel.currentColorSpace);
        ctx.putImageData(imageData, 0, 0);

        saveToHistory(targetPanelId, imageData);

        // store modified image data url for this image
        if (targetPanel.currentImageIndex >= 0 && targetPanel.images[targetPanel.currentImageIndex]) {
            const imgObj = targetPanel.images[targetPanel.currentImageIndex];
            imgObj.modified = imageData;
            imgObj.modifiedDataUrl = previewCanvas.toDataURL();
        }

        targetPanel.clusterResult.centroids = [...sourceCentroids];
        targetPanel.clusterStats = targetPanel.clusterStats.map((stat, i) => {
            const centroid = sourceCentroids[i];
            const colorHex = ColorKMeans.rgbToHex(centroid.r, centroid.g, centroid.b);
            return {
                ...stat,
                color: centroid,
                colorHex: colorHex,
                colorName: getColorName(colorHex),
                label: getColorName(colorHex)
            };
        });
        
        ColorChart.updateChart(targetPanelId.toString(), targetPanel.clusterStats, targetPanel.scatterData);
        showColorEditor(targetPanelId);
        showColorSchemePreview(targetPanelId);
        showColorPresets(targetPanelId);
        
        setTimeout(() => {
            performAIAnalysis(targetPanelId);
        }, 300);

        showToast('配色迁移完成', 'success');
    }

    function performBatchCompare() {
        const selectedImages = [];
        
        if (cachedImages.length < 2) {
            showToast('请至少缓存2张图片进行批量对比', 'error');
            return;
        }

        Object.keys(panels).forEach(panelId => {
            const panel = panels[panelId];
            if (panel.currentImageIndex >= 0) {
                selectedImages.push({
                    panelId: parseInt(panelId),
                    image: panel.images[panel.currentImageIndex]
                });
            }
        });

        if (selectedImages.length === 0) {
            showToast('请先在面板中上传图片', 'error');
            return;
        }

        const firstPanel = panels[selectedImages[0].panelId];
        const k = firstPanel.currentKValue;
        const colorSpace = firstPanel.currentColorSpace;

        showToast(`开始批量对比 ${selectedImages.length} 张图片...`, 'success');

        selectedImages.forEach((item, index) => {
            setTimeout(() => {
                performClusteringWithParams(item.panelId, k, colorSpace);
            }, index * 800);
        });
    }

    function performClusteringWithParams(panelId, k, colorSpace) {
        document.getElementById(`k-value-${panelId}`).value = k;
        document.getElementById(`color-space-${panelId}`).value = colorSpace;
        performClustering(panelId);
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            ${type === 'success' ? '✓' : '✗'} ${message}
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    function openUploadModal(panelId) {
        currentUploadPanelId = panelId;
        const modal = document.getElementById('upload-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    function closeUploadModal() {
        const modal = document.getElementById('upload-modal');
        if (modal) {
            modal.classList.remove('active');
        }
        currentUploadPanelId = null;
        document.getElementById('local-upload').value = '';
    }

    document.getElementById('modal-close').addEventListener('click', closeUploadModal);

    document.getElementById('upload-modal').addEventListener('click', (e) => {
        if (e.target.id === 'upload-modal') {
            closeUploadModal();
        }
    });

    document.querySelectorAll('.preset-image-item').forEach(item => {
        item.addEventListener('click', () => {
            const src = item.dataset.src;
            if (src && currentUploadPanelId !== null) {
                const panelId = currentUploadPanelId;
                closeUploadModal();
                loadPresetImage(src, panelId);
            }
        });
    });

    document.getElementById('local-upload').addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0 && currentUploadPanelId !== null) {
            handleImageUpload({ target: e.target }, currentUploadPanelId);
            closeUploadModal();
        }
    });

    function loadPresetImage(src, panelId) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            const panel = panels[panelId];
            const previewCanvas = document.getElementById(`preview-canvas-${panelId}`);
            const ctx = previewCanvas.getContext('2d');

            const maxWidth = 280;
            const maxHeight = 200;
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (maxHeight / height) * width;
                height = maxHeight;
            }

            previewCanvas.width = width;
            previewCanvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            const originalImageData = ctx.getImageData(0, 0, width, height);
            panel.images.push({
                file: null,
                url: src,
                name: src.split('/').pop(),
                original: originalImageData,
                modified: null,
                width: width,
                height: height
            });
            panel.currentImageIndex = panel.images.length - 1;
            panel.history = [];

            document.getElementById(`canvas-placeholder-${panelId}`).style.display = 'none';
            updateImageSwitcher(panelId);

            cacheImage({ name: src.split('/').pop(), url: previewCanvas.toDataURL() });

            closeUploadModal();
            showToast('图片加载成功', 'success');
        };
        img.onerror = function() {
            closeUploadModal();
            showToast('图片加载失败', 'error');
        };
        img.src = src;
    }

    function handleMigrationFileUpload(e, targetPanelId) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        if (!file.type.startsWith('image/')) {
            showToast('请选择图片文件', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                
                const maxSize = 300;
                let width = img.width;
                let height = img.height;
                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = (maxSize / width) * height;
                        width = maxSize;
                    } else {
                        width = (maxSize / height) * width;
                        height = maxSize;
                    }
                }
                
                tempCanvas.width = width;
                tempCanvas.height = height;
                tempCtx.drawImage(img, 0, 0, width, height);

                const imageData = tempCtx.getImageData(0, 0, width, height);
                const pixels = [];
                for (let i = 0; i < imageData.data.length; i += 4) {
                    const alpha = imageData.data[i + 3];
                    if (alpha === 0) continue;
                    pixels.push({
                        r: imageData.data[i],
                        g: imageData.data[i + 1],
                        b: imageData.data[i + 2]
                    });
                }

                const k = parseInt(document.getElementById(`k-value-${targetPanelId}`).value) || 5;
                const colorSpace = document.getElementById(`color-space-${targetPanelId}`).value || 'rgb';

                const result = ColorKMeans.kmeans(pixels, k, colorSpace);
                const stats = ColorKMeans.getClusterStats(result);

                applyMigrationColors(targetPanelId, stats);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function applyMigrationColors(targetPanelId, sourceStats) {
        const targetPanel = panels[targetPanelId];
        
        if (targetPanel.currentImageIndex < 0) {
            showToast('目标面板需要先上传图片', 'error');
            return;
        }

        const previewCanvas = document.getElementById(`preview-canvas-${targetPanelId}`);
        const ctx = previewCanvas.getContext('2d');
        const currentImage = targetPanel.images[targetPanel.currentImageIndex];
        
        if (!currentImage.original) {
            showToast('无法获取原始图片数据', 'error');
            return;
        }

        const originalData = currentImage.original.data;
        const modifiedData = new Uint8ClampedArray(originalData);

        for (let i = 0; i < originalData.length; i += 4) {
            const r = originalData[i];
            const g = originalData[i + 1];
            const b = originalData[i + 2];

            let minDistance = Infinity;
            let closestColor = null;

            for (const stat of sourceStats) {
                const cr = stat.color.r;
                const cg = stat.color.g;
                const cb = stat.color.b;
                const distance = Math.sqrt(
                    Math.pow(r - cr, 2) + 
                    Math.pow(g - cg, 2) + 
                    Math.pow(b - cb, 2)
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    closestColor = stat.color;
                }
            }

            if (closestColor) {
                modifiedData[i] = closestColor.r;
                modifiedData[i + 1] = closestColor.g;
                modifiedData[i + 2] = closestColor.b;
            }
        }

        const newImageData = new ImageData(modifiedData, currentImage.width, currentImage.height);
        ctx.putImageData(newImageData, 0, 0);

        targetPanel.images[targetPanel.currentImageIndex].modified = newImageData;
        targetPanel.images[targetPanel.currentImageIndex].modifiedDataUrl = ctx.canvas.toDataURL();

        if (!targetPanel.history) targetPanel.history = [];
        targetPanel.history.push({
            type: 'migration',
            data: currentImage.original ? new ImageData(currentImage.original.data, currentImage.width, currentImage.height) : null
        });
        document.getElementById(`undo-btn-${targetPanelId}`).disabled = false;

        ColorChart.updateChart(targetPanelId.toString(), sourceStats);
        
        targetPanel.clusterResult = { clusters: sourceStats.map(s => ({ pixels: [], centroid: s.color })) };
        targetPanel.clusterStats = sourceStats;

        showColorEditor(targetPanelId, sourceStats);
        showToast('配色迁移成功', 'success');
    }
});