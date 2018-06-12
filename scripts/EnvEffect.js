//初始化环境音效
function initEnvEffect(context) {
    let envEffectIndex = -1;//关
    let convolutionInfo = [
        {
            name: 'telephone',//电话
            mainGain: 0.0,
            sendGain: 3.0,
            url: 'filter-telephone.wav'
        },
        {
            name: 'indoor',//室内
            mainGain: 1.0,
            sendGain: 2.5,
            url: 'spreader50-65ms.wav'
        },
        {
            name: 'cave',//山洞
            mainGain: 0.0,
            sendGain: 2.4,
            url: 'feedback-spring.wav'
        },
        {
            name: 'church',//教堂
            mainGain: 1.8,
            sendGain: 0.9,
            url: 'bin_dfeq/s2_r4_bd.wav'
        },
        {
            name: 'kitchen',//厨房
            mainGain: 0.6,
            sendGain: 3.0,
            url: 'house-impulses/kitchen-true-stereo.wav'
        },
        {
            name: 'bedroom',//起居室
            mainGain: 0.6,
            sendGain: 2.1,
            url: 'house-impulses/living-bedroom-leveled.wav'
        }
    ];

    // 初始化各种环境音效节点;
    let sourceGainNode = context.createGain();
    let convolutionNodes = [];
    let gainNodes = [];
    let audioPreURL = '/assets/audio/impulse/';
    for (let i = 0; i < convolutionInfo.length; i++) {
        convolutionNodes[i] = context.createConvolver();
        loadRes(context, audioPreURL + convolutionInfo[i].url, convolutionNodes[i]);
        gainNodes[i] = context.createGain();
        gainNodes[i].gain.value = 0.0;
    }

    function loadRes(context, url, node, callback) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        request.onload = function () {
            context.decodeAudioData(request.response, function (buffer) {//异步应该也没问题//TODO吧
                node.buffer = buffer;
                if (callback && typeof callback === 'function') {
                    callback(buffer);
                }
            }, function () {
                //decode fail
                console('source not support');
            });
        };
        request.send();
    }

    return {
        envEffectIndex:envEffectIndex,
        convolutionInfo:convolutionInfo,
        sourceGainNode:sourceGainNode,
        convolutionNodes:convolutionNodes,
        gainNodes:gainNodes,
    }
}

export default initEnvEffect;