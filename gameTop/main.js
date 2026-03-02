// 　ページ読み込み時に実行
setupCharSelect("p1-chars");
setupCharSelect("p2-chars");

//　データの保存と画面遷移
document.getElementById("startBtn").addEventListener("click", function() {
    // 要素の取得
    const p1Input = document.getElementById("player1Input");
    const p2Input = document.getElementById("player2Input");
    const p1Selected = document.querySelector("#p1-chars .selected");
    const p2Selected = document.querySelector("#p2-chars .selected");
    // エラーチェック
    if (!p1Input || !p2Input || !p1Selected || !p2Selected) {
        alert("名前の入力とキャラクター選択を完了させてください");
        return;
    }
    // 保存
    localStorage.setItem("player1", p1Input.value);
    localStorage.setItem("player2", p2Input.value);
    localStorage.setItem("player1Idx", p1Selected.dataset.player);
    localStorage.setItem("player2Idx", p2Selected.dataset.player);
    window.location.href = "../playArea/game.html";
});

// キャラ選択
function setupCharSelect(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const images = container.querySelectorAll(".player-img");
    images.forEach(img => {
        img.addEventListener("click", function() {
            images.forEach(i => i.classList.remove("selected"));
            this.classList.add("selected");
        });
    });
}