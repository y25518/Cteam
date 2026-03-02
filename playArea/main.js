// DOM取得
const p1skillBtn = document.getElementById("p1skillbtn");
const p2skillBtn = document.getElementById("p2skillbtn");
const startBtn = document.getElementById("startbtn");
const stopBtn = document.getElementById("stopbtn");
const mainDisplay = document.getElementById("stopwatch");
const player = [ document.getElementById("p1time"), document.getElementById("p2time") ];

let startTime;
let timerId;
let turn = 0;   // 0 => 1p, 1 => 2p
let gap = [ 0, 0 ];   // 5秒との時間差を入れる用
let scoreBoard; 

// 勝利数管理(2本先取)
let p1_wins = 0;
let p2_wins = 0;

// キャラクター情報
const charMaster = {
    "c1": { name: "キャラ1", hp: 100, atc: 100, crit:10, cd:3, img: "../img/player1.png" },
    "c2": { name: "キャラ2", hp: 130, atc: 80,  crit:5, cd:4, img: "../img/player2.png" },
    "c3": { name: "キャラ3", hp: 80,  atc: 120, crit:10, cd:2, img: "../img/player3.png" },
    "c4": { name: "キャラ4", hp: 50,  atc: 0, crit:0, cd:5, img: "../img/player4.png" },
};

// LocalStorageからkeyを取得
const p1Key = localStorage.getItem("player1Idx") || "c1"; // 空ならc1に
const p2Key = localStorage.getItem("player2Idx") || "c2";

// データを取り出す
p1Data = structuredClone(charMaster[p1Key]);    // 参照ではなく複製
p1Data.cd = 1;
p2Data = structuredClone(charMaster[p2Key]);
p2Data.cd = 1;

// タイマー更新
function updateTime() {
    const elapsedMs = Date.now() - startTime; // 経過ミリ秒
    const now = new Date(elapsedMs);
    const s = String(now.getSeconds()).padStart(2, '0');
    const ms = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
    
    mainDisplay.textContent = `${s}.${ms}`;

    // 2000ミリ秒（2秒）を過ぎたら hidden-timer クラスをつける
    if (elapsedMs > 2000) {
        mainDisplay.classList.add("hidden-timer");
    } else {
        // 2秒以下のときは見えるようにしておく（リスタート時用）
        mainDisplay.classList.remove("hidden-timer");
    }
}

// ダメージ計算式
function DMcalc (attackerData, turn, gap, diff) {
    const a = Math.abs(gap[turn]);
    
    let baseDamage = 40 * Math.pow(0.78, a);
    let critDamage = 1;

    const advantage = Math.abs(diff);
    const multiplier = 1 + (Math.min(advantage, 2.0) * 0.25);

    if (Math.random() < (attackerData.crit / 100)) {    //crit%でクリティカルが発生、1.5倍
        console.log("クリティカルダメージ");
        critDamage = 2;
    }

    const finalDamage = baseDamage * multiplier * 0.7 * (attackerData.atc / 100) * critDamage;
    console.log(finalDamage);

    // 最低ダメージを 5 に設定
    return Math.max(5, finalDamage);
}

// 勝敗判定
function judge(loserId) {
    if(loserId == -1) return;
    document.getElementById(`p${++loserId}-hp`).style.width = 0 + "%";
    if(loserId==1){
        document.querySelector('#comment1').textContent = "WINNER";
        document.querySelector('#comment2').textContent = localStorage.getItem("player2");
    } else {
        document.querySelector('#comment1').textContent = "WINNER";
        document.querySelector('#comment2').textContent = localStorage.getItem("player1");
    }
    document.getElementById("goal-time").textContent = "K.O";
    center = document.getElementById('center');
    center.innerHTML = '<input id="restart" class="btn" type="button" value="もう一戦"><a href="../gameTop/index.html"><input id="quit" class="btn" type="button" value="やめる"></a>';
    restart.addEventListener('click', () => {location.reload()});   //ページを再読み込み
}

// 画面読み込み時の処理
document.addEventListener("DOMContentLoaded", function() {
    // 画像と名前を反映
    const player1Name = localStorage.getItem("player1") || "player1";
    const player2Name = localStorage.getItem("player2") || "player2";

    const p1name = document.getElementById("p1name");
    const p2name = document.getElementById("p2name");

    if (p1name) p1name.textContent = player1Name;
    if (p2name) p2name.textContent = player2Name;

    const p1Img = document.getElementById("p1-char-img");
    const p2Img = document.getElementById("p2-char-img");

    p1Img.src = p1Data.img; // 画像変更
    p2Img.src = p2Data.img;

    //スコアボード
    scoreBoard = document.getElementById("score-board");
    scoreBoard.textContent = `${p1_wins} - ${p2_wins}`;// 初期表示をセット
    updateCDDisplay(); 
});


// スキル
function applySkills(playerData,playerIdx) {
    // キャラ1：攻撃ステータスを微増
    if (playerIdx == "c1") {
        playerData.atc += 20; 
        playerData.crit += 2;
        document.querySelector('#comment1').textContent = "スキル発動 ステータス上昇！";
        document.querySelector('#comment2').textContent = "攻撃力 +10、クリティカル率 +2%";
    }
    // キャラ2：体力回復
    if (playerIdx == "c2") {
        playerData.hp += 30;
        if(playerData.hp > charMaster["c2"].hp) playerData.hp = charMaster["c2"].hp;
        document.querySelector('#comment1').textContent = "スキル発動 HPが回復！";
        document.querySelector('#comment2').textContent = "HP +30";
    }
    // キャラ3：体力消費でクリティカル率を獲得
    if (playerIdx == "c3") {
        playerData.hp -= 10;
        if(playerData.hp <= 0) playerData.hp = 1;
        playerData.crit += 15;
        if(playerData.crit >= 100) playerData.crit = 100;
        document.querySelector('#comment1').textContent = "スキル発動 HPを消費してクリティカル率上昇";
        document.querySelector('#comment2').textContent = "HP -10、クリティカル率 +15%";
    }
    // キャラ4：最強になる
    if (playerIdx == "c4") {
        playerData.hp += 10000;
        playerData.atc += 10000; 
        playerData.crit += 100;
        if(playerData.crit >= 100) playerData.crit = 100;
        document.querySelector('#comment1').textContent = "スキル発動 覚醒";
        document.querySelector('#comment2').textContent = "HP +10000、攻撃力 +10000、クリティカル率 +100%";
    }
}

// スキルボタン
p1skillBtn.addEventListener('click', () => {
    p1Data.cd = 1; // クールダウンリセット
    applySkills(p1Data, p1Key); 
    
    document.getElementById("p1-hp").style.width = (p1Data.hp / charMaster[p1Key].hp * 100) + "%";
    p1skillBtn.disabled = true; // 発動後にボタンを無効化
});
p2skillBtn.addEventListener('click', () => {
    p2Data.cd = 1;
    applySkills(p2Data, p2Key);
    
    document.getElementById("p2-hp").style.width = (p2Data.hp / charMaster[p2Key].hp * 100) + "%";
    p2skillBtn.disabled = true;
});

// スタートボタン
startBtn.addEventListener('click', () => {
    startBtn.disabled = true;   // スタートボタン潰す
    stopBtn.disabled = false;   // ストップボタン解禁
    startTime = Date.now();
    timerId = setInterval(updateTime, 10);    // 10ミリ秒ごとにupdateTimeを実行
});

// ストップボタン
stopBtn.addEventListener('click', () => {
    startBtn.disabled = false;
    stopBtn.disabled = true;
    clearInterval(timerId);     // setIntervalを止める

    switch (turn) {
    case 0:
        p1skillBtn.disabled = true;
        console.log("p1の 現在のターン数:" + p1Data.cd + " スキル発動可能ターン数:"+charMaster[p1Key].cd);
        break;
    case 1:
        p2skillBtn.disabled = true;
        console.log("p2の 現在のターン数:" + p2Data.cd + " スキル発動可能ターン数:"+charMaster[p2Key].cd);
        break;
    }

    // タイムを記録
    const record = mainDisplay.textContent;
    player[turn].textContent = record;


    // ５秒との差の小数点第三位を四捨五入した値を格納
    gap[turn] = Number((record - 5).toFixed(2));

    // 確認用console.log
    console.log(turn + 1 + "pの記録： タイム:"+ record + " 5sとの差:" + gap[turn]);

    // ダメージ算出
    let damage;
    if (turn == 1) {
        let diff = Math.abs(gap[0]) - Math.abs(gap[1]);     // どっちの攻撃かを正負で判断
        if (diff <= 0) {
            // 1pの攻撃
            damage = Number(DMcalc(p1Data, 0, gap, diff).toFixed(0));   // DMcalc関数の戻り値の小数点第一位を四捨五入
            p2Data.hp -= damage;
            
            setTimeout(() => {
                document.getElementById("p2-hp").style.width = p2Data.hp * (100 / charMaster[p2Key].hp) + "%"; 
            }, 700); //体力のCSSに反映
            document.querySelector('#comment1').textContent = localStorage.getItem("player1") + "の攻撃！";
            document.querySelector('#comment2').textContent = localStorage.getItem("player2") + "に" + damage + "ダメージ！";
            
            console.log("1pの攻撃 " + "ダメージ：" + damage + " p2残りHP:" + p2Data.hp);
            judgeIdx = 1;
        }
        else if (diff >= 0) {
            // 2pの攻撃g
            damage = Number(DMcalc(p2Data, 1, gap, diff).toFixed(0));
            p1Data.hp -= damage;
            
            setTimeout(() => {
                document.getElementById("p1-hp").style.width = p1Data.hp * (100 / charMaster[p1Key].hp) + "%";
            }, 700);
            document.querySelector('#comment1').textContent = localStorage.getItem("player2") + "の攻撃！";
            document.querySelector('#comment2').textContent = localStorage.getItem("player1") + "に" + damage + "ダメージ！";
            
            console.log("2pの攻撃 " + "ダメージ：" + damage + " p1残りHP:" + p1Data.hp);
            judgeIdx = 0;
        }
        else {
            // 引き分け
            damage = 0;
        }

        //　1PのHPが0になった場合（2Pがラウンド勝利）
        if(p1Data.hp <= 0) {
            p2_wins++;  // 2Pに1勝プラス
            scoreBoard.textContent = `${p1_wins} - ${p2_wins}`;

            document.querySelector('#comment2').textContent = localStorage.getItem("player1") + "を倒した！";
            setTimeout(() => {
                document.getElementById("p1-hp").style.width = 0 + "%";
            }, 500);

            //2勝の判定
            if (p2_wins >= 2) {
                judge(0); // 1Pが負けた(0)としてゲーム終了処理へ
            } else {
                // 次のラウンド　HP,CDをリセット
                setTimeout(() => {
                    p1Data = structuredClone(charMaster[p1Key]);    // 参照ではなく複製
                    p1Data.cd = 1;
                    p2Data = structuredClone(charMaster[p2Key]);
                    p2Data.cd = 1;
                    document.getElementById("p1-hp").style.width = "100%";
                    document.getElementById("p2-hp").style.width = "100%";
                    document.querySelector('#comment1').textContent = "ROUND " + (p1_wins + p2_wins + 1);
                    document.querySelector('#comment2').textContent = `1P: ${p1_wins}勝 / 2P: ${p2_wins}勝`;
                }, 3000);
            }
        } 
        //2PのHPが0になった場合（1Pがラウンド勝利）
        else if(p2Data.hp <= 0) {
            p1_wins++;   // 1Pに1勝プラス
            scoreBoard.textContent = `${p1_wins} - ${p2_wins}`;

            document.querySelector('#comment2').textContent = localStorage.getItem("player2") + "を倒した！";
            setTimeout(() => {
                document.getElementById("p2-hp").style.width = 0 + "%";
            }, 500);

            // 2勝の判定
            if (p1_wins >= 2) {
                judge(1); // 2Pが負けた(1)としてゲーム終了処理へ
            } else {
                // 次のラウンド　HP,CDをリセット
                setTimeout(() => {
                    p1Data = structuredClone(charMaster[p1Key]);
                    p1Data.cd = 1;
                    p2Data = structuredClone(charMaster[p2Key]);
                    p2Data.cd = 1;
                    document.getElementById("p1-hp").style.width = "100%";
                    document.getElementById("p2-hp").style.width = "100%";
                    document.querySelector('#comment1').textContent = "ROUND " + (p1_wins + p2_wins + 1);
                    document.querySelector('#comment2').textContent = `1P: ${p1_wins}勝 / 2P: ${p2_wins}勝`;
                }, 3000);
            }
        }
        judgeIdx = -1;
    }

    switch (turn) {
    case 0:
        if(p2Data.cd >= charMaster[p2Key].cd) p2skillBtn.disabled = false;
        if(p2Data.cd < charMaster[p2Key].cd) p2skillBtn.disabled = true;
        p1Data.cd++;
        break;
    case 1:
        if(p1Data.cd >= charMaster[p1Key].cd) p1skillBtn.disabled = false;
        if(p1Data.cd < charMaster[p1Key].cd) p1skillBtn.disabled = true;
        p2Data.cd++;
        break;
    }

    // プレイヤー切り替え
    turn = (turn + 1) % 2;

    mainDisplay.classList.remove("hidden-timer"); // タイマーを表示状態に戻す
});
