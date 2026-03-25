// ============================================================
// EXERCISE DATABASE — 80 Übungen mit Bildern, DE/EN Namen
// Quelle: yuhonas/free-exercise-db (MIT Lizenz)
// ============================================================
(function() {
var IMG = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
var DB = [
// --- CHEST ---
{n:"Barbell Bench Press",de:"Bankdrücken",a:["bench press","flachbank","flat bench"],bp:"chest",t:"pectorals",id:"Barbell_Bench_Press_-_Medium_Grip"},
{n:"Incline Dumbbell Press",de:"Schrägbankdrücken",a:["incline press","schrägbank"],bp:"chest",t:"pectorals",id:"Incline_Dumbbell_Press"},
{n:"Dumbbell Bench Press",de:"Kurzhantel Bankdrücken",a:["db bench","kh bankdrücken"],bp:"chest",t:"pectorals",id:"Dumbbell_Bench_Press"},
{n:"Decline Barbell Bench Press",de:"Negativ Bankdrücken",a:["decline bench","negativ bank"],bp:"chest",t:"pectorals",id:"Decline_Barbell_Bench_Press"},
{n:"Push-Ups",de:"Liegestütze",a:["pushups","push ups","liegestütz"],bp:"chest",t:"pectorals",id:"Pushups"},
{n:"Dumbbell Flyes",de:"Fliegende",a:["flys","flyes","butterfly"],bp:"chest",t:"pectorals",id:"Dumbbell_Flyes"},
{n:"Cable Crossover",de:"Kabelzug Crossover",a:["cable fly","kabelzug"],bp:"chest",t:"pectorals",id:"Cable_Crossover"},
// --- BACK ---
{n:"Deadlift",de:"Kreuzheben",a:["barbell deadlift","conventional deadlift"],bp:"back",t:"lower back",id:"Barbell_Deadlift"},
{n:"Bent Over Row",de:"Vorgebeugtes Rudern",a:["barbell row","langhantel rudern","bent over barbell row"],bp:"back",t:"middle back",id:"Bent_Over_Barbell_Row"},
{n:"Lat Pulldown",de:"Latzug",a:["wide grip lat pulldown","latziehen"],bp:"back",t:"lats",id:"Wide-Grip_Lat_Pulldown"},
{n:"Seated Cable Row",de:"Kabelrudern sitzend",a:["cable row","rudern sitzend"],bp:"back",t:"middle back",id:"Seated_Cable_Rows"},
{n:"Pull-Up",de:"Klimmzug",a:["pull up","pullup","klimmzüge","chin up"],bp:"back",t:"lats",id:"Pullups"},
{n:"One-Arm Dumbbell Row",de:"Einarmiges Rudern",a:["dumbbell row","kh rudern"],bp:"back",t:"middle back",id:"One-Arm_Dumbbell_Row"},
{n:"T-Bar Row",de:"T-Bar Rudern",a:["t bar","tbar"],bp:"back",t:"middle back",id:"Lying_T-Bar_Row"},
{n:"Back Extension",de:"Rückenstrecker",a:["hyperextension","rückenstrecker"],bp:"back",t:"lower back",id:"Hyperextensions_Back_Extensions"},
// --- SHOULDERS ---
{n:"Military Press",de:"Schulterdrücken",a:["overhead press","ohp","standing press","schulterdrücken"],bp:"shoulders",t:"shoulders",id:"Standing_Military_Press"},
{n:"Seated Dumbbell Press",de:"Schulterdrücken sitzend",a:["dumbbell shoulder press","kh schulterdrücken"],bp:"shoulders",t:"shoulders",id:"Seated_Dumbbell_Press"},
{n:"Lateral Raise",de:"Seitheben",a:["side lateral raise","seitenheben","side raise"],bp:"shoulders",t:"shoulders",id:"Side_Lateral_Raise"},
{n:"Front Raise",de:"Frontheben",a:["front dumbbell raise","vorderheben"],bp:"shoulders",t:"shoulders",id:"Front_Dumbbell_Raise"},
{n:"Reverse Fly",de:"Reverse Fly",a:["rear delt fly","reverse flyes","hintere schulter"],bp:"shoulders",t:"shoulders",id:"Reverse_Flyes"},
{n:"Face Pull",de:"Face Pull",a:["facepull","face pulls"],bp:"shoulders",t:"shoulders",id:"Face_Pull"},
{n:"Upright Row",de:"Aufrechtes Rudern",a:["upright barbell row","aufrechtes rudern"],bp:"shoulders",t:"shoulders",id:"Upright_Barbell_Row"},
{n:"Arnold Press",de:"Arnold Press",a:["arnold dumbbell press"],bp:"shoulders",t:"shoulders",id:"Arnold_Dumbbell_Press"},
// --- LEGS ---
{n:"Squat",de:"Kniebeuge",a:["barbell squat","back squat","kniebeugen","squats"],bp:"legs",t:"quadriceps",id:"Barbell_Squat"},
{n:"Front Squat",de:"Frontkniebeuge",a:["front barbell squat","frontsquat"],bp:"legs",t:"quadriceps",id:"Front_Barbell_Squat"},
{n:"Leg Press",de:"Beinpresse",a:["leg press machine","beinpresse"],bp:"legs",t:"quadriceps",id:"Leg_Press"},
{n:"Leg Extension",de:"Beinstrecker",a:["leg extensions","beinstrecken"],bp:"legs",t:"quadriceps",id:"Leg_Extensions"},
{n:"Leg Curl",de:"Beinbeuger",a:["lying leg curl","beinbeuger","hamstring curl"],bp:"legs",t:"hamstrings",id:"Lying_Leg_Curls"},
{n:"Romanian Deadlift",de:"Rumänisches Kreuzheben",a:["rdl","stiff leg deadlift","rumänisch"],bp:"legs",t:"hamstrings",id:"Stiff-Legged_Barbell_Deadlift"},
{n:"Lunge",de:"Ausfallschritt",a:["barbell lunge","lunges","ausfallschritte"],bp:"legs",t:"quadriceps",id:"Barbell_Lunge"},
{n:"Dumbbell Lunge",de:"KH Ausfallschritt",a:["dumbbell lunges","walking lunge"],bp:"legs",t:"quadriceps",id:"Dumbbell_Lunges"},
{n:"Calf Raise",de:"Wadenheben",a:["standing calf raise","calf raises","wadenheben stehend"],bp:"legs",t:"calves",id:"Standing_Calf_Raises"},
{n:"Goblet Squat",de:"Goblet Squat",a:["kelch kniebeuge"],bp:"legs",t:"quadriceps",id:"Goblet_Squat"},
{n:"Sumo Deadlift",de:"Sumo Kreuzheben",a:["sumo"],bp:"legs",t:"hamstrings",id:"Sumo_Deadlift"},
{n:"Hip Thrust",de:"Hip Thrust",a:["barbell hip thrust","glute bridge"],bp:"legs",t:"glutes",id:"Barbell_Hip_Thrust"},
{n:"Bulgarian Split Squat",de:"Bulgarische Kniebeuge",a:["split squat","einbeinig"],bp:"legs",t:"quadriceps",id:"Single_Leg_Squat"},
{n:"Step-Up",de:"Step-Up",a:["step ups","aufstiege"],bp:"legs",t:"quadriceps",id:"Barbell_Step_Ups"},
// --- BICEPS ---
{n:"Barbell Curl",de:"Langhantel Curl",a:["bicep curl","lh curl","curls"],bp:"arms",t:"biceps",id:"Barbell_Curl"},
{n:"Dumbbell Curl",de:"Kurzhantel Curl",a:["bicep curl","kh curl","dumbbell bicep curl"],bp:"arms",t:"biceps",id:"Dumbbell_Bicep_Curl"},
{n:"Hammer Curl",de:"Hammer Curl",a:["hammer curls","hammercurl"],bp:"arms",t:"biceps",id:"Hammer_Curls"},
{n:"Concentration Curl",de:"Konzentrations-Curl",a:["concentration curls","scottcurl"],bp:"arms",t:"biceps",id:"Concentration_Curls"},
{n:"Preacher Curl",de:"Preacher Curl",a:["larry scott curl","scottbank"],bp:"arms",t:"biceps",id:"Preacher_Curl"},
{n:"EZ-Bar Curl",de:"SZ-Stange Curl",a:["ez bar curl","sz curl"],bp:"arms",t:"biceps",id:"EZ-Bar_Curl"},
// --- TRICEPS ---
{n:"Triceps Pushdown",de:"Trizepsdrücken",a:["cable pushdown","trizeps kabel"],bp:"arms",t:"triceps",id:"Triceps_Pushdown"},
{n:"Skull Crusher",de:"Skull Crusher",a:["lying triceps press","french press","stirndrücken"],bp:"arms",t:"triceps",id:"Lying_Triceps_Press"},
{n:"Dips",de:"Dips",a:["tricep dips","barrenstütz"],bp:"arms",t:"triceps",id:"Dips_-_Triceps_Version"},
{n:"Close-Grip Bench Press",de:"Enges Bankdrücken",a:["close grip bench","enges bankdrücken"],bp:"arms",t:"triceps",id:"Close-Grip_Barbell_Bench_Press"},
{n:"Overhead Triceps Extension",de:"Überkopf Trizeps",a:["cable overhead","trizeps überkopf","french press kabel"],bp:"arms",t:"triceps",id:"Cable_Rope_Overhead_Triceps_Extension"},
{n:"Tricep Kickback",de:"Trizeps Kickback",a:["kickback","kickbacks"],bp:"arms",t:"triceps",id:"Tricep_Dumbbell_Kickback"},
// --- CORE ---
{n:"Plank",de:"Plank",a:["unterarmstütz","planke","planks"],bp:"core",t:"abdominals",id:"Plank"},
{n:"Hanging Leg Raise",de:"Beinheben hängend",a:["leg raise","beinheben"],bp:"core",t:"abdominals",id:"Hanging_Leg_Raise"},
{n:"Cable Crunch",de:"Kabel Crunch",a:["cable crunches","kabelzug crunch"],bp:"core",t:"abdominals",id:"Cable_Crunch"},
{n:"Russian Twist",de:"Russian Twist",a:["russian twists","rumpfdrehung"],bp:"core",t:"abdominals",id:"Russian_Twist"},
{n:"Crunch",de:"Crunch",a:["crunches","bauchpresse","sit-up","sit up"],bp:"core",t:"abdominals",id:"Crunches"},
{n:"Ab Roller",de:"Ab Roller",a:["ab wheel","bauchroller"],bp:"core",t:"abdominals",id:"Ab_Roller"},
{n:"Mountain Climber",de:"Mountain Climber",a:["bergsteiger","mountain climbers"],bp:"core",t:"abdominals",id:"Mountain_Climbers"},
{n:"Dead Bug",de:"Dead Bug",a:["toter käfer"],bp:"core",t:"abdominals",id:"Dead_Bug"},
// --- WARMUP / MOBILITY ---
{n:"Arm Circle",de:"Armkreisen",a:["arm circles","schulterkreisen"],bp:"shoulders",t:"shoulders",id:"Arm_Circles"},
{n:"Leg Swing",de:"Beinschwingen",a:["leg swings","beinschwung"],bp:"legs",t:"quadriceps",id:"Leg_Swings"},
{n:"Cat Stretch",de:"Katzenbuckel",a:["cat cow","katze kuh"],bp:"back",t:"lower back",id:"Cat_Stretch"},
{n:"Groin Stretch",de:"Leistendehnung",a:["adduktor dehnung","groin"],bp:"legs",t:"adductors",id:"Groiners"},
{n:"Standing Calf Stretch",de:"Wadendehnung",a:["calf stretch","waden dehnen"],bp:"legs",t:"calves",id:"Standing_Gastrocnemius_Calf_Stretch"},
{n:"Hip Circle",de:"Hüftkreisen",a:["hip circles","hüftmobilisation"],bp:"legs",t:"glutes",id:"Hip_Circles_(Prone)"},
{n:"Shoulder Stretch",de:"Schulterdehnung",a:["cross body stretch","schulter dehnen"],bp:"shoulders",t:"shoulders",id:"Shoulder_Stretch"},
{n:"World's Greatest Stretch",de:"World's Greatest Stretch",a:["wgs","greatest stretch"],bp:"legs",t:"quadriceps",id:"Worlds_Greatest_Stretch"},
// --- CARDIO / FULL BODY ---
{n:"Burpee",de:"Burpee",a:["burpees"],bp:"cardio",t:"full body",id:"Burpees"},
{n:"Jumping Jack",de:"Hampelmann",a:["jumping jacks","hampelmänner"],bp:"cardio",t:"full body",id:"Jumping_Jacks"},
{n:"Box Jump",de:"Box Jump",a:["box jumps","kastensprung"],bp:"legs",t:"quadriceps",id:"Box_Jump_(Multiple_Response)"},
{n:"Kettlebell Swing",de:"Kettlebell Swing",a:["kb swing","kettlebell swings"],bp:"legs",t:"hamstrings",id:"Kettlebell_Sumo_Deadlift_High_Pull"},
{n:"Battle Ropes",de:"Battle Ropes",a:["battle rope","seilschwingen"],bp:"cardio",t:"full body",id:"Battling_Ropes"},
{n:"Rowing",de:"Rudern (Maschine)",a:["rowing machine","rudergerät","rudern"],bp:"cardio",t:"full body",id:"Rowing,_Stationary"},
{n:"Power Clean",de:"Power Clean",a:["clean","umsetzen"],bp:"legs",t:"hamstrings",id:"Power_Clean"},
{n:"Thruster",de:"Thruster",a:["front squat to press","thrusters"],bp:"legs",t:"quadriceps",id:"Clean_and_Press"},
{n:"Farmer's Walk",de:"Farmer's Walk",a:["farmer walk","koffertragen"],bp:"back",t:"forearms",id:"Farmers_Walk"},
{n:"Wall Ball",de:"Wall Ball",a:["wall balls","medizinball werfen"],bp:"legs",t:"quadriceps",id:"Wall_Ball_Squat"}
];

// Bild-URL generieren
DB.forEach(function(e) { e.img = IMG + e.id + '/0.jpg'; });

// Fuzzy-Match Funktion
window.EXERCISE_DB = DB;
window.findExerciseMatch = function(query) {
    if(!query) return null;
    var q = query.toLowerCase().trim();
    var best = null, bestScore = 0;
    for(var i = 0; i < DB.length; i++) {
        var e = DB[i];
        var score = 0;
        // Exakter Match
        if(e.n.toLowerCase() === q || e.de.toLowerCase() === q) return e;
        // Enthält-Match
        if(q.includes(e.de.toLowerCase()) || e.de.toLowerCase().includes(q)) score = 80;
        if(q.includes(e.n.toLowerCase()) || e.n.toLowerCase().includes(q)) score = Math.max(score, 80);
        // Alias-Match
        for(var j = 0; j < e.a.length; j++) {
            if(q.includes(e.a[j]) || e.a[j].includes(q)) score = Math.max(score, 70);
        }
        // Wort-Match
        var words = q.split(/[\s,\-\/]+/);
        var matched = 0;
        for(var w = 0; w < words.length; w++) {
            if(words[w].length < 3) continue;
            var allText = (e.n + ' ' + e.de + ' ' + e.a.join(' ')).toLowerCase();
            if(allText.includes(words[w])) matched++;
        }
        var totalWords = words.filter(function(w) { return w.length >= 3; }).length;
        if(totalWords > 0) score = Math.max(score, (matched / totalWords) * 60);
        // BodyPart Bonus
        if(score > 0 && q.includes(e.bp)) score += 5;
        if(score > bestScore) { bestScore = score; best = e; }
    }
    return bestScore >= 30 ? best : null;
};

// BodyPart → Lucide Icon Fallback
window.getBodyPartIcon = function(bp) {
    var map = { chest:'heart', back:'arrow-down-up', shoulders:'move-vertical', legs:'footprints', arms:'grip-vertical', core:'target', cardio:'zap' };
    return map[bp] || 'dumbbell';
};
})();
