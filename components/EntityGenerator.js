if (typeof AFRAME === 'undefined') {
    throw new Error('Component attempted to register before AFRAME was available.');
}

import config from '../scripts/config';

//用于创建多个空组件
AFRAME.registerComponent('entity-generator', {
    schema: {
        mixin: { default: '' },
        num: { default: config.spectrumNum }
    },
    //巨简单
    init: function () {
        var data = this.data;

        //使用mixin
        for (var i = 0; i < data.num; i++) {
            var entity = document.createElement('a-entity');
            entity.setAttribute('mixin', data.mixin);
            this.el.appendChild(entity);
        }

    }
});
