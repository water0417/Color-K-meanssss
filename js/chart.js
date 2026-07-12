/**
 * ECharts图表封装模块
 * 支持多图表类型（饼图/柱状图/玫瑰图/色卡图/散点图）和多实例管理
 */

const ColorChart = (function() {
    const chartInstances = {};
    const chartData = {};
    const currentChartTypes = {};
    const chartBackgrounds = {};

    /**
     * 初始化ECharts实例
     * @param {string} panelId - 面板ID
     * @param {string} containerId - 容器ID
     */
    function initChart(panelId, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        chartInstances[panelId] = echarts.init(container);
        currentChartTypes[panelId] = 'pie';
        chartData[panelId] = [];
        chartBackgrounds[panelId] = '#f5f7fa';

        bindResizeEvent(panelId);
    }

    /**
     * 绑定窗口缩放事件，自动适配图表大小
     * @param {string} panelId - 面板ID
     */
    function bindResizeEvent(panelId) {
        window.addEventListener('resize', function() {
            if (chartInstances[panelId]) {
                chartInstances[panelId].resize();
            }
        });
    }

    /**
     * 设置图表背景色
     * @param {string} panelId - 面板ID
     * @param {string} color - 背景颜色
     */
    function setBackground(panelId, color) {
        chartBackgrounds[panelId] = color;
        const container = document.getElementById(`chart-container-${panelId}`);
        if (container) {
            container.style.background = color;
        }
        if (chartData[panelId].length > 0) {
            updateChart(panelId, chartData[panelId]);
        }
    }

    /**
     * 生成饼图配置
     * @param {Array} data - 聚类统计数据
     * @param {string} bgColor - 背景颜色
     * @returns {Object} ECharts配置对象
     */
    function getPieOption(data, bgColor) {
        return {
            backgroundColor: bgColor,
            tooltip: {
                trigger: 'item',
                formatter: function(params) {
                    return `${params.name}<br/>颜色: ${params.color}<br/>像素数: ${params.value.toLocaleString()}<br/>占比: ${params.percent}%`;
                },
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#e0e0e0',
                borderWidth: 1,
                textStyle: {
                    color: '#333'
                }
            },
            legend: {
                orient: 'horizontal',
                bottom: '5%',
                textStyle: {
                    color: '#666'
                },
                itemGap: 15
            },
            series: [{
                name: '颜色聚类',
                type: 'pie',
                radius: ['35%', '75%'],
                center: ['50%', '50%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 8,
                    borderColor: '#fff',
                    borderWidth: 3
                },
                label: {
                    show: true,
                    position: 'outside',
                    formatter: '{b}: {d}%',
                    fontSize: 12,
                    color: '#555'
                },
                labelLine: {
                    show: true,
                    length: 15,
                    length2: 10
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 14,
                        fontWeight: 'bold'
                    },
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.2)'
                    }
                },
                data: data.map(item => ({
                    name: item.label,
                    value: item.pixelCount,
                    itemStyle: {
                        color: item.colorHex
                    }
                }))
            }]
        };
    }

    /**
     * 生成柱状图配置
     * @param {Array} data - 聚类统计数据
     * @param {string} bgColor - 背景颜色
     * @returns {Object} ECharts配置对象
     */
    function getBarOption(data, bgColor) {
        return {
            backgroundColor: bgColor,
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                },
                formatter: function(params) {
                    const item = params[0];
                    return `${item.name}<br/>颜色: ${item.color}<br/>像素数: ${item.value.toLocaleString()}`;
                },
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#e0e0e0',
                borderWidth: 1,
                textStyle: {
                    color: '#333'
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                top: '15%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: data.map(item => item.label),
                axisLabel: {
                    color: '#666',
                    fontSize: 12
                },
                axisLine: {
                    lineStyle: {
                        color: '#e0e0e0'
                    }
                }
            },
            yAxis: {
                type: 'value',
                name: '像素数量',
                nameTextStyle: {
                    color: '#666'
                },
                axisLabel: {
                    color: '#666',
                    fontSize: 12,
                    formatter: function(value) {
                        if (value >= 1000) {
                            return (value / 1000).toFixed(1) + 'k';
                        }
                        return value;
                    }
                },
                axisLine: {
                    show: false
                },
                splitLine: {
                    lineStyle: {
                        color: '#e0e0e0',
                        type: 'dashed'
                    }
                }
            },
            series: [{
                name: '像素数',
                type: 'bar',
                barWidth: '50%',
                data: data.map(item => ({
                    value: item.pixelCount,
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: item.colorHex },
                            { offset: 1, color: adjustColor(item.colorHex, -30) }
                        ]),
                        borderRadius: [6, 6, 0, 0]
                    }
                })),
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.2)'
                    }
                },
                label: {
                    show: true,
                    position: 'top',
                    formatter: '{c}',
                    fontSize: 11,
                    color: '#555'
                }
            }]
        };
    }

    /**
     * 生成玫瑰图配置
     * @param {Array} data - 聚类统计数据
     * @param {string} bgColor - 背景颜色
     * @returns {Object} ECharts配置对象
     */
    function getRoseOption(data, bgColor) {
        return {
            backgroundColor: bgColor,
            tooltip: {
                trigger: 'item',
                formatter: function(params) {
                    return `${params.name}<br/>颜色: ${params.color}<br/>像素数: ${params.value.toLocaleString()}<br/>占比: ${params.percent}%`;
                },
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#e0e0e0',
                borderWidth: 1,
                textStyle: {
                    color: '#333'
                }
            },
            legend: {
                orient: 'horizontal',
                bottom: '5%',
                textStyle: {
                    color: '#666'
                },
                itemGap: 15
            },
            series: [{
                name: '颜色聚类',
                type: 'pie',
                radius: ['10%', '70%'],
                center: ['50%', '45%'],
                roseType: 'radius',
                itemStyle: {
                    borderRadius: 8,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: true,
                    formatter: '{b}: {d}%',
                    fontSize: 11,
                    color: '#555'
                },
                labelLine: {
                    show: true,
                    length: 10,
                    length2: 5
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 13,
                        fontWeight: 'bold'
                    },
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.2)'
                    }
                },
                data: data.map(item => ({
                    name: item.label,
                    value: item.pixelCount,
                    itemStyle: {
                        color: item.colorHex
                    }
                }))
            }]
        };
    }

    /**
     * 生成色卡条形图配置
     * @param {Array} data - 聚类统计数据
     * @param {string} bgColor - 背景颜色
     * @returns {Object} ECharts配置对象
     */
    function getSwatchOption(data, bgColor) {
        return {
            backgroundColor: bgColor,
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                },
                formatter: function(params) {
                    const item = params[0];
                    return `${item.name}<br/>颜色: ${item.color}<br/>像素数: ${item.value.toLocaleString()}<br/>占比: ${((item.value / item.data.total) * 100).toFixed(2)}%`;
                },
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#e0e0e0',
                borderWidth: 1,
                textStyle: {
                    color: '#333'
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '20%',
                top: '10%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: data.map(item => item.label + '\n' + item.colorHex),
                axisLabel: {
                    color: '#666',
                    fontSize: 11,
                    align: 'center',
                    verticalAlign: 'middle'
                },
                axisLine: {
                    lineStyle: {
                        color: '#e0e0e0'
                    }
                }
            },
            yAxis: {
                type: 'value',
                name: '像素数量',
                nameTextStyle: {
                    color: '#666'
                },
                axisLabel: {
                    color: '#666',
                    fontSize: 12,
                    formatter: function(value) {
                        if (value >= 1000) {
                            return (value / 1000).toFixed(1) + 'k';
                        }
                        return value;
                    }
                },
                axisLine: {
                    show: false
                },
                splitLine: {
                    lineStyle: {
                        color: '#e0e0e0',
                        type: 'dashed'
                    }
                }
            },
            series: [{
                name: '像素数',
                type: 'bar',
                barWidth: '70%',
                data: data.map(item => ({
                    value: item.pixelCount,
                    total: data.reduce((sum, d) => sum + d.pixelCount, 0),
                    itemStyle: {
                        color: item.colorHex,
                        borderRadius: [4, 4, 0, 0]
                    }
                })),
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.2)'
                    }
                },
                label: {
                    show: true,
                    position: 'top',
                    formatter: '{c}',
                    fontSize: 11,
                    color: '#555'
                }
            }]
        };
    }

    /**
     * 生成LAB散点图配置
     * @param {Array} data - 散点图数据
     * @param {string} bgColor - 背景颜色
     * @returns {Object} ECharts配置对象
     */
    function getScatterOption(data, bgColor) {
        return {
            backgroundColor: bgColor,
            tooltip: {
                trigger: 'item',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#e0e0e0',
                borderWidth: 1,
                textStyle: {
                    color: '#333'
                }
            },
            legend: {
                orient: 'horizontal',
                bottom: '5%',
                textStyle: {
                    color: '#666'
                },
                itemGap: 15
            },
            grid: {
                left: '8%',
                right: '8%',
                bottom: '15%',
                top: '10%',
                containLabel: true
            },
            xAxis: {
                type: 'value',
                name: 'A (绿-红)',
                nameTextStyle: {
                    color: '#666'
                },
                min: -128,
                max: 128,
                axisLabel: {
                    color: '#666',
                    fontSize: 12
                },
                axisLine: {
                    lineStyle: {
                        color: '#e0e0e0'
                    }
                },
                splitLine: {
                    lineStyle: {
                        color: '#e0e0e0',
                        type: 'dashed'
                    }
                }
            },
            yAxis: {
                type: 'value',
                name: 'L (明度)',
                nameTextStyle: {
                    color: '#666'
                },
                min: 0,
                max: 100,
                axisLabel: {
                    color: '#666',
                    fontSize: 12
                },
                axisLine: {
                    lineStyle: {
                        color: '#e0e0e0'
                    }
                },
                splitLine: {
                    lineStyle: {
                        color: '#e0e0e0',
                        type: 'dashed'
                    }
                }
            },
            series: data
        };
    }

    /**
     * 调整颜色亮度
     * @param {string} hex - 十六进制颜色值
     * @param {number} amount - 调整量
     * @returns {string} 调整后的颜色值
     */
    function adjustColor(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + amount));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
        const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    /**
     * 更新图表数据
     * @param {string} panelId - 面板ID
     * @param {Array} data - 聚类统计数据
     * @param {Array} scatterData - 散点图数据（可选）
     */
    function updateChart(panelId, data, scatterData = null) {
        const chart = chartInstances[panelId];
        if (!chart || !data || data.length === 0) return;

        chartData[panelId] = data;
        const chartType = currentChartTypes[panelId];
        const bgColor = chartBackgrounds[panelId];
        
        let option;
        switch (chartType) {
            case 'pie':
                option = getPieOption(data, bgColor);
                break;
            case 'bar':
                option = getBarOption(data, bgColor);
                break;
            case 'rose':
                option = getRoseOption(data, bgColor);
                break;
            case 'swatch':
                option = getSwatchOption(data, bgColor);
                break;
            case 'scatter':
                option = getScatterOption(scatterData || [], bgColor);
                break;
            default:
                option = getPieOption(data, bgColor);
        }
        
        chart.setOption(option, true);
        showChart(panelId);
    }

    /**
     * 切换图表类型
     * @param {string} panelId - 面板ID
     * @param {string} type - 图表类型
     * @param {Array} scatterData - 散点图数据（可选）
     */
    function switchChart(panelId, type, scatterData = null) {
        const chart = chartInstances[panelId];
        if (!chart || currentChartTypes[panelId] === type) return;

        currentChartTypes[panelId] = type;
        
        if (chartData[panelId].length > 0) {
            updateChart(panelId, chartData[panelId], scatterData);
        }
    }

    /**
     * 显示图表容器
     * @param {string} panelId - 面板ID
     */
    function showChart(panelId) {
        const chart = document.getElementById(`chart-${panelId}`);
        const placeholder = document.getElementById(`chart-placeholder-${panelId}`);
        
        if (chart && placeholder) {
            chart.style.display = 'block';
            placeholder.style.display = 'none';
        }
    }

    /**
     * 隐藏图表并显示占位符
     * @param {string} panelId - 面板ID
     */
    function hideChart(panelId) {
        const chart = document.getElementById(`chart-${panelId}`);
        const placeholder = document.getElementById(`chart-placeholder-${panelId}`);
        
        if (chart && placeholder) {
            chart.style.display = 'none';
            placeholder.style.display = 'flex';
        }
    }

    /**
     * 清空图表数据
     * @param {string} panelId - 面板ID
     */
    function clearChart(panelId) {
        const chart = chartInstances[panelId];
        if (chart) {
            chart.clear();
            chartData[panelId] = [];
        }
        hideChart(panelId);
    }

    /**
     * 获取当前图表类型
     * @param {string} panelId - 面板ID
     * @returns {string} 当前图表类型
     */
    function getCurrentChartType(panelId) {
        return currentChartTypes[panelId] || 'pie';
    }

    /**
     * 销毁图表实例
     * @param {string} panelId - 面板ID
     */
    function destroyChart(panelId) {
        const chart = chartInstances[panelId];
        if (chart) {
            chart.dispose();
            delete chartInstances[panelId];
            delete chartData[panelId];
            delete currentChartTypes[panelId];
            delete chartBackgrounds[panelId];
        }
    }

    return {
        initChart,
        updateChart,
        switchChart,
        clearChart,
        getCurrentChartType,
        destroyChart,
        setBackground
    };
})();