/**
 * 颜色K-Means聚类算法模块
 * 作业核心文件 - 独立手写实现，禁止使用第三方聚类库
 */

const ColorKMeans = (function() {
    /**
     * RGB转LAB颜色空间
     * @param {number} r - 红色通道值(0-255)
     * @param {number} g - 绿色通道值(0-255)
     * @param {number} b - 蓝色通道值(0-255)
     * @returns {Object} LAB颜色对象
     */
    function rgbToLab(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

        const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
        const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
        const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

        const fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
        const fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
        const fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

        return {
            l: (116 * fy) - 16,
            a: 500 * (fx - fy),
            b: 200 * (fy - fz)
        };
    }

    /**
     * RGB转HSL颜色空间
     * @param {number} r - 红色通道值(0-255)
     * @param {number} g - 绿色通道值(0-255)
     * @param {number} b - 蓝色通道值(0-255)
     * @returns {Object} HSL颜色对象
     */
    function rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return {
            h: h * 360,
            s: s * 100,
            l: l * 100
        };
    }

    /**
     * RGB转CMYK颜色空间
     * @param {number} r - 红色通道值(0-255)
     * @param {number} g - 绿色通道值(0-255)
     * @param {number} b - 蓝色通道值(0-255)
     * @returns {Object} CMYK颜色对象
     */
    function rgbToCmyk(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const k = 1 - Math.max(r, g, b);
        const c = (1 - r - k) / (1 - k) || 0;
        const m = (1 - g - k) / (1 - k) || 0;
        const y = (1 - b - k) / (1 - k) || 0;

        return {
            c: c * 100,
            m: m * 100,
            y: y * 100,
            k: k * 100
        };
    }

    /**
     * RGB颜色空间距离计算（欧氏距离）
     * @param {Object} color1 - RGB颜色对象
     * @param {Object} color2 - RGB颜色对象
     * @returns {number} 距离值
     */
    function rgbDistance(color1, color2) {
        const dr = color1.r - color2.r;
        const dg = color1.g - color2.g;
        const db = color1.b - color2.b;
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    /**
     * LAB颜色空间距离计算（CIE76公式）
     * @param {Object} lab1 - LAB颜色对象
     * @param {Object} lab2 - LAB颜色对象
     * @returns {number} 距离值
     */
    function labDistance(lab1, lab2) {
        const dl = lab1.l - lab2.l;
        const da = lab1.a - lab2.a;
        const db = lab1.b - lab2.b;
        return Math.sqrt(dl * dl + da * da + db * db);
    }

    /**
     * HSL颜色空间距离计算
     * @param {Object} hsl1 - HSL颜色对象
     * @param {Object} hsl2 - HSL颜色对象
     * @returns {number} 距离值
     */
    function hslDistance(hsl1, hsl2) {
        const dh = Math.min(Math.abs(hsl1.h - hsl2.h), 360 - Math.abs(hsl1.h - hsl2.h));
        const ds = hsl1.s - hsl2.s;
        const dl = hsl1.l - hsl2.l;
        return Math.sqrt(dh * dh + ds * ds + dl * dl);
    }

    /**
     * CMYK颜色空间距离计算
     * @param {Object} cmyk1 - CMYK颜色对象
     * @param {Object} cmyk2 - CMYK颜色对象
     * @returns {number} 距离值
     */
    function cmykDistance(cmyk1, cmyk2) {
        const dc = cmyk1.c - cmyk2.c;
        const dm = cmyk1.m - cmyk2.m;
        const dy = cmyk1.y - cmyk2.y;
        const dk = cmyk1.k - cmyk2.k;
        return Math.sqrt(dc * dc + dm * dm + dy * dy + dk * dk);
    }

    /**
     * 从Canvas读取像素数据
     * @param {HTMLCanvasElement} canvas - Canvas元素
     * @returns {Array} 像素数组，每个元素包含{r, g, b}
     */
    function getPixelsFromCanvas(canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = [];
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const alpha = data[i + 3];

            if (alpha > 0) {
                pixels.push({ r, g, b });
            }
        }

        return pixels;
    }

    /**
     * 将RGB颜色转换为指定颜色空间
     * @param {Object} rgb - RGB颜色对象
     * @param {string} colorSpace - 目标颜色空间
     * @returns {Object} 转换后的颜色对象
     */
    function convertToColorSpace(rgb, colorSpace) {
        switch (colorSpace) {
            case 'lab':
                return rgbToLab(rgb.r, rgb.g, rgb.b);
            case 'hsl':
                return rgbToHsl(rgb.r, rgb.g, rgb.b);
            case 'cmyk':
                return rgbToCmyk(rgb.r, rgb.g, rgb.b);
            case 'rgb':
            default:
                return { ...rgb };
        }
    }

    /**
     * 在指定颜色空间计算两个颜色的距离
     * @param {Object} color1 - RGB颜色对象
     * @param {Object} color2 - RGB颜色对象
     * @param {string} colorSpace - 颜色空间
     * @returns {number} 距离值
     */
    function calculateDistance(color1, color2, colorSpace) {
        const c1 = convertToColorSpace(color1, colorSpace);
        const c2 = convertToColorSpace(color2, colorSpace);

        switch (colorSpace) {
            case 'lab':
                return labDistance(c1, c2);
            case 'hsl':
                return hslDistance(c1, c2);
            case 'cmyk':
                return cmykDistance(c1, c2);
            case 'rgb':
            default:
                return rgbDistance(c1, c2);
        }
    }

    /**
     * 初始化聚类中心（随机选择K个像素作为初始中心）
     * @param {Array} pixels - 像素数组
     * @param {number} k - 聚类数量
     * @returns {Array} 初始聚类中心数组
     */
    function initializeCentroids(pixels, k) {
        const centroids = [];
        const shuffled = [...pixels].sort(() => Math.random() - 0.5);
        const safeK = Math.min(k, shuffled.length);
        
        for (let i = 0; i < safeK; i++) {
            centroids.push({ ...shuffled[i] });
        }
        
        return centroids;
    }

    /**
     * 将每个像素分配到最近的聚类中心
     * @param {Array} pixels - 像素数组
     * @param {Array} centroids - 聚类中心数组
     * @param {string} colorSpace - 颜色空间
     * @returns {Array} 簇数组，每个簇包含属于该簇的像素
     */
    function assignPixelsToClusters(pixels, centroids, colorSpace) {
        const clusters = new Array(centroids.length).fill(null).map(() => []);

        for (const pixel of pixels) {
            let minDistance = Infinity;
            let clusterIndex = 0;

            for (let i = 0; i < centroids.length; i++) {
                const distance = calculateDistance(pixel, centroids[i], colorSpace);
                if (distance < minDistance) {
                    minDistance = distance;
                    clusterIndex = i;
                }
            }

            clusters[clusterIndex].push(pixel);
        }

        return clusters;
    }

    /**
     * 计算新的聚类中心（取每个簇的平均颜色）
     * @param {Array} clusters - 簇数组
     * @returns {Array} 新的聚类中心数组
     */
    function calculateNewCentroids(clusters) {
        const centroids = [];

        for (const cluster of clusters) {
            if (cluster.length === 0) {
                centroids.push({ r: Math.random() * 255, g: Math.random() * 255, b: Math.random() * 255 });
                continue;
            }

            let sumR = 0, sumG = 0, sumB = 0;

            for (const pixel of cluster) {
                sumR += pixel.r;
                sumG += pixel.g;
                sumB += pixel.b;
            }

            centroids.push({
                r: Math.round(sumR / cluster.length),
                g: Math.round(sumG / cluster.length),
                b: Math.round(sumB / cluster.length)
            });
        }

        return centroids;
    }

    /**
     * 检查聚类中心是否收敛（变化小于阈值）
     * @param {Array} oldCentroids - 旧聚类中心数组
     * @param {Array} newCentroids - 新聚类中心数组
     * @param {number} threshold - 收敛阈值
     * @returns {boolean} 是否收敛
     */
    function hasConverged(oldCentroids, newCentroids, threshold = 1) {
        for (let i = 0; i < oldCentroids.length; i++) {
            const distance = rgbDistance(oldCentroids[i], newCentroids[i]);
            if (distance > threshold) {
                return false;
            }
        }
        return true;
    }

    /**
     * K-Means聚类主算法
     * @param {Array} pixels - 像素数组
     * @param {number} k - 聚类数量
     * @param {string} colorSpace - 颜色空间
     * @param {number} maxIterations - 最大迭代次数
     * @returns {Object} 聚类结果
     */
    function kmeans(pixels, k, colorSpace = 'rgb', maxIterations = 100) {
        if (pixels.length === 0) {
            return { clusters: [], centroids: [], totalPixels: 0 };
        }

        if (k > pixels.length) {
            k = pixels.length;
        }

        let centroids = initializeCentroids(pixels, k);
        let clusters = [];
        let iterations = 0;

        while (iterations < maxIterations) {
            clusters = assignPixelsToClusters(pixels, centroids, colorSpace);
            
            const newCentroids = calculateNewCentroids(clusters);
            
            if (hasConverged(centroids, newCentroids)) {
                break;
            }

            centroids = newCentroids;
            iterations++;
        }

        return {
            clusters,
            centroids,
            totalPixels: pixels.length,
            iterations
        };
    }

    /**
     * 获取聚类结果统计信息
     * @param {Object} result - K-Means聚类结果
     * @returns {Array} 统计数组，每个元素包含颜色和像素数量
     */
    function getClusterStats(result) {
        const stats = [];

        for (let i = 0; i < result.centroids.length; i++) {
            const centroid = result.centroids[i];
            const pixelCount = result.clusters[i].length;
            const percentage = result.totalPixels > 0 
                ? ((pixelCount / result.totalPixels) * 100) 
                : 0;

            stats.push({
                color: centroid,
                colorHex: rgbToHex(centroid.r, centroid.g, centroid.b),
                pixelCount,
                percentage,
                label: `颜色${i + 1}`
            });
        }

        return stats.sort((a, b) => b.pixelCount - a.pixelCount);
    }

    /**
     * RGB转十六进制颜色值
     * @param {number} r - 红色通道值(0-255)
     * @param {number} g - 绿色通道值(0-255)
     * @param {number} b - 蓝色通道值(0-255)
     * @returns {string} 十六进制颜色值
     */
    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    /**
     * 十六进制转RGB颜色值
     * @param {string} hex - 十六进制颜色值
     * @returns {Object} RGB颜色对象
     */
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * 获取像素在聚类结果中的簇索引
     * @param {Object} pixel - RGB颜色对象
     * @param {Array} centroids - 聚类中心数组
     * @param {string} colorSpace - 颜色空间
     * @returns {number} 簇索引
     */
    function getPixelClusterIndex(pixel, centroids, colorSpace) {
        let minDistance = Infinity;
        let clusterIndex = 0;

        for (let i = 0; i < centroids.length; i++) {
            const distance = calculateDistance(pixel, centroids[i], colorSpace);
            if (distance < minDistance) {
                minDistance = distance;
                clusterIndex = i;
            }
        }

        return clusterIndex;
    }

    /**
     * 色彩迁移：将源配色映射到目标图片
     * @param {HTMLCanvasElement} targetCanvas - 目标画布
     * @param {Array} sourceCentroids - 源配色聚类中心（原颜色）
     * @param {Array} targetCentroids - 目标配色聚类中心（新颜色）
     * @param {string} colorSpace - 颜色空间
     * @returns {ImageData} 重配色后的图像数据
     */
    function migrateColors(targetCanvas, sourceCentroids, targetCentroids, colorSpace) {
        const ctx = targetCanvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const alpha = data[i + 3];

            if (alpha > 0) {
                const clusterIndex = getPixelClusterIndex({ r, g, b }, sourceCentroids, colorSpace);
                const newColor = targetCentroids[clusterIndex] || { r, g, b };
                
                data[i] = newColor.r;
                data[i + 1] = newColor.g;
                data[i + 2] = newColor.b;
            }
        }

        return imageData;
    }

    /**
     * 图片重配色：修改特定簇的颜色后重新渲染图片
     * @param {HTMLCanvasElement} canvas - 画布
     * @param {Array} centroids - 聚类中心数组
     * @param {number} clusterIndex - 要修改的簇索引
     * @param {Object} newColor - 新颜色
     * @param {string} colorSpace - 颜色空间
     * @returns {ImageData} 重配色后的图像数据
     */
    function recolorImage(canvas, centroids, clusterIndex, newColor, colorSpace) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const modifiedCentroids = [...centroids];
        modifiedCentroids[clusterIndex] = newColor;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const alpha = data[i + 3];

            if (alpha > 0) {
                const pixelClusterIndex = getPixelClusterIndex({ r, g, b }, centroids, colorSpace);
                if (pixelClusterIndex === clusterIndex) {
                    data[i] = newColor.r;
                    data[i + 1] = newColor.g;
                    data[i + 2] = newColor.b;
                }
            }
        }

        return imageData;
    }

    /**
     * 获取LAB散点图数据
     * @param {Array} clusters - 簇数组
     * @param {Array} centroids - 聚类中心数组
     * @returns {Array} 散点图系列数据
     */
    function getLabScatterData(clusters, centroids) {
        const series = [];

        for (let i = 0; i < clusters.length; i++) {
            const cluster = clusters[i];
            const centroid = centroids[i];
            const labCentroid = rgbToLab(centroid.r, centroid.g, centroid.b);
            const colorHex = rgbToHex(centroid.r, centroid.g, centroid.b);

            const points = [];
            const sampleSize = Math.min(cluster.length, 500);
            const step = Math.floor(cluster.length / sampleSize);

            for (let j = 0; j < cluster.length; j += step) {
                const pixel = cluster[j];
                const lab = rgbToLab(pixel.r, pixel.g, pixel.b);
                points.push([lab.a, lab.l]);
            }

            series.push({
                name: `颜色${i + 1}`,
                type: 'scatter',
                data: points,
                symbolSize: 8,
                itemStyle: {
                    color: colorHex,
                    opacity: 0.7
                },
                emphasis: {
                    itemStyle: {
                        opacity: 1,
                        shadowBlur: 10
                    },
                    label: {
                        show: true,
                        formatter: `${colorHex}\n像素数: ${cluster.length}`
                    }
                }
            });
        }

        return series;
    }

    return {
        getPixelsFromCanvas,
        kmeans,
        getClusterStats,
        rgbToHex,
        hexToRgb,
        rgbToLab,
        rgbToHsl,
        rgbToCmyk,
        rgbDistance,
        labDistance,
        calculateDistance,
        getPixelClusterIndex,
        migrateColors,
        recolorImage,
        getLabScatterData
    };
})();