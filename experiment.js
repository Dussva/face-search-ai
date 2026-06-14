
const CFG = {
  ff_csv:   "trials_face_face.csv",
  fix_ms:   500,
  cue_ms:   1500,
  blank_ms: 500,  
  max_rt:   5000, 
  isi_ms:   500,
  practice_n: 8,

  explicit_real_pool: [
    "real_002.png","real_003.png","real_007.png","real_010.png",
    "real_015.png","real_020.png","real_033.png","real_039.png",
  ],
  explicit_ai_pool: [
    "ai_001.png","ai_002.png","ai_003.png","ai_004.png",
    "ai_005.png","ai_006.png","ai_007.png","ai_008.png",
  ],
  explicit_n: 4,
};

function uid() {
  return "p_" + Date.now() + "_" + Math.random().toString(36).slice(2,6);
}
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const h = lines[0].split(",").map(x=>x.trim());
  return lines.slice(1).filter(l=>l.trim()).map(line=>{
    const v = line.split(",").map(x=>x.trim());
    const o = {};
    h.forEach((k,i)=>o[k]=v[i]??"");
    return o;
  });
}
async function fetchCSV(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("Ошибка загрузки "+url+": "+r.status);
  return parseCSV(await r.text());
}
function shuffle(arr) {
  const a=arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function sampleN(arr,n){ return shuffle(arr).slice(0,Math.min(n,arr.length)); }
function unique(arr){ return [...new Set(arr.filter(x=>x&&x.trim()))]; }
function parseBool(x){ return String(x).toLowerCase().trim()==="true"; }

function fix()   { return '<p style="font-size:60px;color:#fff;margin:0">+</p>'; }
function blank() { return '<p style="color:#808080;font-size:1px">.</p>'; }
function fbHtml(ok) {
  return ok ? '<p class="fb-yes">Верно</p>' : '<p class="fb-no">Неверно</p>';
}
function arrowKey(k) {
  k = String(k||"").toLowerCase().trim();
  if(k==="f") return "arrowleft";
  if(k==="j") return "arrowright";
  return k;
}

(async()=>{

const PARTICIPANT = uid();
let ffAll;
try {
  ffAll = await fetchCSV(CFG.ff_csv);
} catch(e) {
  document.body.innerHTML =
    '<div style="color:#fff;padding:40px;font-size:18px">'+
    'Ошибка загрузки trials_face_face.csv<br><br>'+e+'</div>';
  return;
}

const ffPractice = sampleN(ffAll, CFG.practice_n);
const mainPool   = ffAll.filter(r=>!ffPractice.includes(r));

const ffMain = shuffle(mainPool.map(t=>({...t,repetition:1})));

const explicitReal = sampleN(CFG.explicit_real_pool, CFG.explicit_n)
  .map(f=>({filename:f,origin:"real"}));
const explicitAi = sampleN(CFG.explicit_ai_pool, CFG.explicit_n)
  .map(f=>({filename:f,origin:"ai"}));
const explicitTrials = shuffle([...explicitReal, ...explicitAi]);

const compImgs  = unique(ffAll.map(t=>t.composite_image));
const cueImgs   = unique(ffAll.map(t=>t.cue_image));
const faceImgs  = unique([...CFG.explicit_real_pool,...CFG.explicit_ai_pool]);

const jsPsych = initJsPsych({});
const tl = [];

tl.push({
  type: jsPsychPreload,
  images: unique([...compImgs,...cueImgs,...faceImgs]),
  show_progress_bar: true,
  continue_after_error: true,
  message: '<p style="color:#fff;font-size:16px">Загрузка изображений...</p>',
});

tl.push({
  type: jsPsychHtmlButtonResponse,
  stimulus:
    '<div class="box"><h2>Информация об исследовании</h2>'+
    '<p>Вы приглашены принять участие в научном исследовании, посвящённом особенностям зрительного восприятия.</p>'+
    '<p>Участие <strong>анонимно и добровольно</strong>. Вы можете прекратить в любой момент.</p>'+
    '<p>Эксперимент займёт около <strong>10–15 минут</strong>.</p>'+
    '<p>Данные используются исключительно в учебно-научных целях (курсовая работа, НИУ ВШЭ).</p>'+
    '</div>',
  choices: ["Согласен(а) — начать"],
});

tl.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: function() {
    const mob = /android|iphone|ipad|ipod|mobile|tablet/.test(navigator.userAgent.toLowerCase());
    if(mob) return '<div class="box warn-box"><h2>Требуется компьютер</h2>'+
      '<p>Этот эксперимент нельзя проходить с телефона или планшета.</p>'+
      '<p>Вернитесь к ссылке с компьютера или ноутбука.</p></div>';
    return '<div class="box"><h2>Перед началом</h2><ul>'+
      '<li>Вы за <strong>компьютером или ноутбуком</strong></li>'+
      '<li>Клавиши <strong>←</strong> и <strong>→</strong> доступны</li>'+
      '<li>Браузер развёрнут <strong>на весь экран</strong> (F11)</li>'+
      '<li>Экран на расстоянии <strong>вытянутой руки</strong></li>'+
      '<li>Есть <strong>10–15 минут</strong> в тишине без отвлечений</li>'+
      '</ul></div>';
  },
  choices: ["Всё готово — продолжить"],
  on_finish: function() {
    const ua = navigator.userAgent.toLowerCase();
    jsPsych.data.addProperties({
      participant_id: PARTICIPANT,
      user_agent:     navigator.userAgent,
      screen_width:   screen.width,
      screen_height:  screen.height,
      is_mobile: /android|iphone|ipad|ipod|mobile|tablet/.test(ua),
    });
  }
});

tl.push({
  type: jsPsychSurveyHtmlForm,
  html:
    '<div class="box"><h2>Несколько вопросов о вас</h2>'+
    '<div class="form-row"><label>Возраст:</label>'+
    '<input type="number" name="age" min="18" max="80" required placeholder="например, 22"></div>'+
    '<div class="form-row"><label>Пол:</label>'+
    '<select name="gender" required>'+
    '<option value="">— выберите —</option>'+
    '<option value="female">Женский</option>'+
    '<option value="male">Мужской</option>'+
    '</select></div>'+
    '<div class="form-row"><label>Устройство:</label>'+
    '<select name="device" required>'+
    '<option value="">— выберите —</option>'+
    '<option value="desktop">Компьютер / ноутбук</option>'+
    '<option value="tablet">Планшет</option>'+
    '<option value="phone">Телефон</option>'+
    '</select></div>'+
    '<div class="form-row">'+
    '<label>Как часто вы используете инструменты на основе ИИ (ChatGPT, Gemini, Midjourney и др.)?</label>'+
    '<select name="ai_use_frequency" required>'+
    '<option value="">— выберите —</option>'+
    '<option value="4">Ежедневно</option>'+
    '<option value="3">Несколько раз в неделю</option>'+
    '<option value="2">Несколько раз в месяц</option>'+
    '<option value="1">Несколько раз за всё время</option>'+
    '<option value="0">Никогда</option>'+
    '</select></div>'+
    '<div class="form-row">'+
    '<label>Как часто вам приходилось сознательно определять, является ли изображение реальной фотографией или создано ИИ?</label>'+
    '<select name="ai_detection_experience" required>'+
    '<option value="">— выберите —</option>'+
    '<option value="4">Регулярно (несколько раз в неделю и чаще)</option>'+
    '<option value="3">Иногда (несколько раз в месяц)</option>'+
    '<option value="2">Редко (несколько раз за всё время)</option>'+
    '<option value="1">Один-два раза в жизни</option>'+
    '<option value="0">Никогда</option>'+
    '</select></div>'+
    '</div>',
  button_label: "Продолжить",
  on_finish: function(data) {
    jsPsych.data.addProperties({
      age:                     data.response.age,
      gender:                  data.response.gender,
      device:                  data.response.device,
      ai_use_frequency:        parseInt(data.response.ai_use_frequency),
      ai_detection_experience: parseInt(data.response.ai_detection_experience),
    });
  }
});

tl.push({
  type: jsPsychHtmlButtonResponse,
  stimulus:
    '<div class="box"><h2>Задача</h2>'+
    '<p>В каждой пробе сначала появится <strong>одно лицо</strong>. Его нужно запомнить.</p>'+
    '<p>Затем появится набор из нескольких лиц. Ваша задача — определить, было ли запомненное лицо в этом наборе.</p>'+
    '<div class="keys">'+
    '<div class="key">←<span>лица НЕ БЫЛО</span></div>'+
    '<div class="key">→<span>лицо БЫЛО</span></div>'+
    '</div>'+
    '<p>Держите пальцы на клавишах <strong>←</strong> и <strong>→</strong>.</p>'+
    '<p><strong>Важно:</strong> в начале каждой пробы — фиксационный крест (+). Смотрите на него и <strong>не двигайте глазами</strong> до появления набора. Отвечайте как можно быстрее.</p>'+
    '<p>Если ответ не дан в течение 5 секунд — проба завершится автоматически.</p>'+
    '<p>Сначала — несколько тренировочных проб с обратной связью.</p>'+
    '</div>',
  choices: ["Начать тренировку"],
});

function buildTrial(t, practice) {
  const cueP  = t.cue_image;
  const compP = t.composite_image;
  const correctKey = arrowKey(t.correct_key);
  const nodes = [];

  nodes.push({ type:jsPsychHtmlKeyboardResponse,
    stimulus:fix(), choices:"NO_KEYS", trial_duration:CFG.fix_ms });

  nodes.push({ type:jsPsychHtmlKeyboardResponse,
    stimulus:
      '<div style="text-align:center">'+
      '<p style="color:#fff;font-size:18px;margin-bottom:12px">Запомните это лицо</p>'+
      '<img src="'+cueP+'" style="width:256px;height:256px;object-fit:contain;'+
      'border:3px solid #fff;border-radius:4px;background:#808080">'+
      '</div>',
    choices:"NO_KEYS", trial_duration:CFG.cue_ms, response_ends_trial:false });

  nodes.push({ type:jsPsychHtmlKeyboardResponse,
    stimulus:blank(), choices:"NO_KEYS",
    trial_duration:CFG.blank_ms, response_ends_trial:false });

  nodes.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus:
      '<div style="text-align:center">'+
      '<img src="'+compP+'" style="max-width:90vw;max-height:72vh;display:block;margin:0 auto">'+
      '<p style="color:#fff;font-size:18px;margin-top:16px">Было ли запомненное лицо в наборе?</p>'+
      '<div class="keys" style="margin-top:12px">'+
      '<div class="key">←<span>НЕ БЫЛО</span></div>'+
      '<div class="key">→<span>БЫЛО</span></div>'+
      '</div></div>',
    choices: ["arrowleft","arrowright"],
    trial_duration: CFG.max_rt,
    response_ends_trial: true,
    data: {
      save_trial:      true,
      participant_id:  PARTICIPANT,
      trial_id:        t.trial_id,
      block:           "face_face",
      target_origin:   t.target_origin,
      set_size:        parseInt(t.set_size),
      target_present:  parseBool(t.target_present),
      cue_image:       t.cue_image,
      composite_image: t.composite_image,
      target_position: t.target_position,
      correct_key:     correctKey,
      repetition:      t.repetition || 1,
      is_practice:     practice,
    },
    on_finish: function(d) {
      d.no_response = (d.response === null);
      d.response    = d.response ? String(d.response).toLowerCase() : "";
      d.correct     = (!d.no_response && d.response === d.correct_key);
      d.trial_index_global = jsPsych.data.get().count();
    }
  });

  if(practice) {
    nodes.push({ type:jsPsychHtmlKeyboardResponse,
      stimulus:function(){
        return fbHtml(jsPsych.data.getLastTrialData().values()[0].correct);
      },
      choices:"NO_KEYS", trial_duration:800 });
  }

  nodes.push({ type:jsPsychHtmlKeyboardResponse,
    stimulus:blank(), choices:"NO_KEYS", trial_duration:CFG.isi_ms });

  return nodes;
}

ffPractice.forEach(t=>buildTrial(t,true).forEach(n=>tl.push(n)));

tl.push({
  type: jsPsychHtmlButtonResponse,
  stimulus:
    '<div class="box"><h2>Тренировка завершена</h2>'+
    '<p>Начинается основной блок. Обратной связи больше не будет.</p>'+
    '<p>Запоминайте показанное лицо и ищите его в наборе.</p>'+
    '<div class="keys">'+
    '<div class="key">←<span>НЕ БЫЛО</span></div>'+
    '<div class="key">→<span>БЫЛО</span></div>'+
    '</div></div>',
  choices: ["Начать основной блок"],
});

ffMain.forEach(t=>buildTrial(t,false).forEach(n=>tl.push(n)));

tl.push({
  type: jsPsychHtmlButtonResponse,
  stimulus:
    '<div class="box"><h2>Последняя часть</h2>'+
    '<p>Вам будет показано несколько отдельных лиц. По каждому — два вопроса:</p>'+
    '<ol style="padding-left:20px;line-height:2">'+
    '<li>Насколько это лицо кажется вам <strong>реальным</strong>?</li>'+
    '<li>Это <strong>реальная фотография</strong> или <strong>сгенерировано ИИ</strong>?</li>'+
    '</ol>'+
    '<p>На просмотр времени нет ограничений. Доверяйте первому впечатлению.</p>'+
    '</div>',
  choices: ["Начать"],
});

function buildExplicitTrial(t) {
  const nodes = [];
  nodes.push({ type:jsPsychHtmlKeyboardResponse,
    stimulus:fix(), choices:"NO_KEYS", trial_duration:500 });
  nodes.push({
    type: jsPsychHtmlButtonResponse,
    stimulus:
      '<div style="text-align:center">'+
      '<img src="'+t.filename+'" style="width:256px;height:256px;object-fit:contain;'+
      'display:block;margin:0 auto;border:3px solid #fff;border-radius:4px;background:#808080">'+
      '<p style="color:#fff;font-size:18px;margin-top:20px">Насколько это лицо кажется вам реальным?</p>'+
      '<p style="color:#aaa;font-size:13px">1 — явно искусственное &nbsp;&nbsp;&nbsp; 7 — явно реальное</p>'+
      '</div>',
    choices: ["1","2","3","4","5","6","7"],
    button_html: '<button class="jspsych-btn" style="margin:0 3px;min-width:44px">%choice%</button>',
    data: { save_trial:true, participant_id:PARTICIPANT,
      block:"explicit_realism", true_origin:t.origin, filename:t.filename },
    on_finish: function(d){ d.realism_rating = d.response+1; }
  });
  nodes.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: '<div style="text-align:center;padding:20px 0">'+
      '<p style="color:#fff;font-size:20px">Это лицо реальное или сгенерировано ИИ?</p></div>',
    choices: ["Реальная фотография","Сгенерировано ИИ"],
    data: { save_trial:true, participant_id:PARTICIPANT,
      block:"explicit_classification", true_origin:t.origin, filename:t.filename },
    on_finish: function(d){
      d.classification_response = (d.response===0)?"real":"ai";
      d.classification_correct  = (d.classification_response===d.true_origin);
    }
  });
  nodes.push({ type:jsPsychHtmlKeyboardResponse,
    stimulus:blank(), choices:"NO_KEYS", trial_duration:400 });
  return nodes;
}

explicitTrials.forEach(t=>buildExplicitTrial(t).forEach(n=>tl.push(n)));

tl.push({
  type: jsPsychHtmlButtonResponse,
  stimulus:
    '<div class="box"><h2>Исследование завершено</h2>'+
    '<p>Большое спасибо за участие!</p>'+
    '<p style="margin-top:16px"><strong>О чём было это исследование:</strong></p>'+
    '<p>Мы изучали, насколько быстро и точно человек находит ранее показанное лицо среди других лиц '+
    'и зависит ли это от того, является ли лицо реальной фотографией или создано искусственным интеллектом.</p>'+
    '<p>Ваши ответы сохранены. Можете закрыть эту страницу.</p>'+
    '</div>',
  choices: ["Закрыть"],
});

jsPsych.run(tl);

})();