window.onload = () => {
    let beginBtn = document.getElementById('beginBtn');
    let audio = document.getElementById('song');
    let audioFile =  document.getElementById('file');
    let beginPanel = document.getElementById('beginPanel');
    beginBtn.addEventListener('click', () => {
        beginPanel.remove();
        audio.play();
    })
    audioFile.addEventListener('change',() => {
        let file = audioFile.files[0];
        audio.src = URL.createObjectURL(file);
        setTimeout(() => {
            beginPanel.remove();
            audio.play();
        }, 500);
    })
}