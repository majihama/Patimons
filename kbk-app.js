(function () {
  "use strict";

  try {
    if (typeof NodeList !== "undefined" && NodeList.prototype && !NodeList.prototype.forEach) {
      NodeList.prototype.forEach = Array.prototype.forEach;
    }
    if (typeof HTMLCollection !== "undefined" && HTMLCollection.prototype && !HTMLCollection.prototype.forEach) {
      HTMLCollection.prototype.forEach = Array.prototype.forEach;
    }
  } catch (e) {}

  const STAT_KEYS = ["HP", "SP", "STG", "DX", "VI", "MA", "EN", "AG", "LUK"];
  const MUSIC = {
    clinic: ["Music/Clinic.mp3", "music/Clinic.mp3", "music/clinic.mp3"],
    safe: ["Music/Safe Area.mp3", "music/Safe Area.mp3", "music/Safe%20Area.mp3"],
    nervous: ["Music/Nervo.mp3", "Music/Nervious.mp3", "music/Nervo.mp3", "music/Nervious.mp3"],
    dungeonV1: ["Music/DungeonV1.mp3", "music/DungeonV1.mp3", "music/dungeonv1.mp3"],
    boss: ["Music/Battle of OTA.mp3", "Music/Battle of ota.mp3", "music/Battle of OTA.mp3"],
    miniboss: ["Music/DungeonLv4.mp3", "music/DungeonLv4.mp3", "music/dungeonlv4.mp3"],
    youthful: ["Music/Youthful.mp3", "music/Youthful.mp3"],
    chill: ["Music/Chill out.mp3", "music/Chill out.mp3", "music/Chill%20out.mp3"],
    pinkun: ["Music/Pinkun.mp3", "music/Pinkun.mp3", "music/pinkun.mp3"],
    omen: ["Music/Omen.mp3", "music/Omen.mp3"],
  };
  const BG_PAGE = ["Fondo/Fondo.png", "Fondo/fondo.png", "Fondo/fondo.jpg", "Fondo/bg.jpg"];
  const VN_BG = [
    "Misc/Backgrounds/Nudopermanencia.png",
    "Misc/Backgrounds/Ciudad.webp",
    "Misc/Backgrounds/Hospital.webp",
    "Misc/Backgrounds/Cavidad.png",
    "miscs/backgronds/vn1.jpg",
    "miscs/backgrounds/vn1.jpg",
  ];
  const COMBAT_BG = [
    "Misc/Backgrounds/Hospital.webp",
    "Misc/Backgrounds/Ciudad.webp",
    "Misc/Backgrounds/Cavidad.png",
    "Misc/Backgrounds/Nudopermanencia.png",
    "Backgrounds/Hospital.webp",
    "Backgrounds/Ciudad.webp",
    "Backgrounds/Cavidad.png",
    "Backgrounds/Nudopermanencia.png",
    "miscs/backgronds/combat.jpg",
  ];

  /** Fondos del hub/exploración LOTG (carpeta miscs/backgrounds y Misc). */
  const LOTG_HUB_BACKGROUNDS = [
    "miscs/backgrounds/vn1.jpg",
    "miscs/backgronds/vn1.jpg",
    "Misc/Backgrounds/Ciudad.webp",
    "Misc/Backgrounds/Hospital.webp",
    "Misc/Backgrounds/Cavidad.png",
    "Misc/Backgrounds/Nudopermanencia.png",
    "Backgrounds/Ciudad.webp",
    "Backgrounds/Hospital.webp",
  ];

  /** Triángulo: Fuego > Hielo > Trueno > Fuego. Resto = Neutral (×1). */
  const LOTG_TRIANGLE = { Fuego: "Hielo", Hielo: "Trueno", Trueno: "Fuego" };

  /** Balance fijo de defensa enemiga por tramo de piso (se aplica en scaleEnemy). */
  const LOTG_ENEMY_DEF_BANDS = [
    { min: 1, max: 6, enMult: 1.0, viMult: 1.0 },
    { min: 7, max: 10, enMult: 0.78, viMult: 0.9 },
    { min: 11, max: 15, enMult: 0.72, viMult: 0.86 },
    { min: 16, max: 20, enMult: 0.67, viMult: 0.82 },
    { min: 21, max: 999, enMult: 0.63, viMult: 0.78 },
  ];

  /** Caps objetivo de EN final por tipo enemigo para evitar esponjas. */
  const LOTG_ENEMY_EN_CAP = {
    normal: { base: 210, perFloor: 4 },
    mini: { base: 260, perFloor: 5 },
    boss: { base: 320, perFloor: 6 },
  };

  /** Escalado de daño por tipo de técnica (tabla hardcodeada). */
  const LOTG_DAMAGE_SCALING = {
    phys: { stg: 1.0, weapon: 0.9, dx: 0.2 },
    mag: { ma: 1.0, weapon: 0.85, sp: 0.18 },
    firearm: { dx: 1.0, weapon: 1.0, stg: 0.25 },
  };

  /** Soul Points iniciales. Común ×1 = 700 SP; premium ×1 = 870, ×10 = 2500. */
  const INITIAL_SOUL = 3200;

  const EQUIP_SLOTS = ["Cabeza", "Cuerpo", "Arma", "Accesorio"];
  const MAX_PARTY_ALLIES = 3;
  const MAX_MERGE_RANK = 6;

  /** Historia (visual novel): prólogo multipágina; encuentro con recluta con elecciones; capítulos por piso. */
  const STORY_LIN_PORTRAIT = "Char/Lawliet.png";
  const STORY_CHAPTERS = [
    {
      id: "prologo",
      unlockFloor: 0,
      title: "Prólogo — Llamada desde el vacío",
      bg: 0,
      vnMood: "calm",
      pages: [
        {
          vnMood: "calm",
          speaker: "Narración",
          expression: "noche húmeda, farolas anaranjadas en el cristal",
          text:
            "La radio del vehículo corta el silencio con estática, como si la ciudad respirara al otro lado del cristal empañado. No es humo lo que ves: es una capa de ‘permanencia’, un velo que el manual de campo no nombra. Tu jefe de unidad repite el protocolo por el auricular; tú asientes, pero ya sabes que los protocolos nacieron para un mundo que ya no existe.",
        },
        {
          vnMood: "calm",
          speaker: "Tú (doctor)",
          expression: "manos firmes en el volante, mente en modo triaje",
          text:
            "Te llaman por tu título —médico— como si fuera un escudo. Lo es, hasta que el primer herido te mira y no pregunta por la herida, sino si tú también oyes el zumbido. El zumbido no figura en ningún electrocardiograma. Late en los muros, en las tuberías, en los pasillos que el GPS marca como ‘cerrados por mantenimiento eterno’.",
        },
        {
          vnMood: "calm",
          speaker: "Narración",
          expression: "cola de ambulancias, murmullo de radios ajenas",
          text:
            "Un interno te envía una foto borrosa del perímetro: sombras demasiado rectas, humo que no sube del todo. Alguien en los comentarios escribe ‘parece un set de cine’ y borra el mensaje antes de que puedas archivarlo. El humor nervioso de la gente normal huele a miedo disfrazado de ironía.",
        },
        {
          vnMood: "calm",
          speaker: "Tú (doctor)",
          expression: "voz baja, casi un juramento interior",
          text:
            "Repasas mentalmente el bolso: vendas, suero, atropina por si acaso, y esa manía tuya de llevar un boli extra porque la burocracia siempre te pide firmar algo en el peor momento. No es heroísmo; es hábito. Los hábitos son lo último que se rompe cuando el pánico llama a la puerta.",
        },
        {
          vnMood: "tension",
          speaker: "Narración",
          expression: "informe sellado, tinta demasiado negra",
          text:
            "El informe oficial habla de ‘Nudos de permanencia’: zonas donde el tiempo, el dolor y el miedo quedan atrapados en bucle. Los civiles atrapados en el centro comercial no son solo rehenes del fuego ni del derrumbe; son rehenes de un eco que repite el mismo minuto hasta desgastar el alma. Tu juramento no menciona ecos. Aun así, tu mano aprieta el estetoscopio hasta que el metal te deja marca en la palma.",
        },
        {
          vnMood: "tension",
          speaker: "Narración",
          expression: "puerta de servicio, bisagra que suena a advertencia",
          text:
            "Antes de cruzar el perímetro, guardas una foto que no es tuya en el bolsillo —una polaroid arrugada que alguien dejó en la ambulancia— y una dosis de analgésico que sí es tuya. La puerta de servicio gime. Del otro lado, el aire sabe a metal frío y a recuerdos ajenos. Una voz lejana, quizá la tuya, pide evacuación por el altavoz. Tú no has tocado el micrófono.",
        },
        {
          vnMood: "tension",
          speaker: "Eco en el pasillo",
          expression: "voz distorsionada, casi familiar",
          text:
            "—…repito, se necesita médico en pasillo B…—\n\nLa frase se corta en un chasquido seco, como si alguien hubiera arrancado el cable del mundo. Un vigilante te dice que no hay pasillo B en ese ala. El mapa en su mano dice otra cosa. Nadie discute en voz alta: solo intercambian miradas de ‘tú tampoco lo viste, ¿verdad?’.",
        },
        {
          vnMood: "serious",
          speaker: "Narración",
          expression: "primer umbral del Nudo",
          text:
            "El primer paso dentro del Nudo es siempre el más fácil: todavía crees que el dolor se puede medir, que la muerte respeta turnos. Más adelante entenderás que aquí el combate no es solo contra carne corrupta, sino contra la insistencia del lugar en recordarte cosas que no viviste. Por ahora, avanzas. La ciudad te observa. Tú observas de vuelta, como buen médico: con atención, con miedo contenido, con la promesa de no abandonar a quien todavía late.",
        },
      ],
    },
    {
      id: "vignette_aliada",
      unlockFloor: 3,
      title: "Interludio — Quien camina contigo",
      type: "choice",
      requiresRosterMin: 1,
      partnerUnitName: "Aozora Lin",
      bg: 1,
      vnMood: "calm",
      pages: [
        {
          vnMood: "calm",
          speaker: "Narración",
          expression: "pasillo ‘nuevo’ en un hospital que ya no confías en sus planos",
          text:
            "El pasillo que no figuraba en el croquis termina en una sala de espera demasiado limpia. Las sillas de plástico están alineadas como dientes; la única luz viva es un letrero de ‘SILENCIO’ parpadeando sin apagarse nunca. Huele a producto de limpieza barato y a tormenta lejana, ese olor a ozono que la precede antes que su voz.",
        },
        {
          vnMood: "calm",
          speaker: "Tú (doctor)",
          expression: "cuello rígido, instinto de no dar la espalda a las puertas",
          text:
            "Apoyas la palma en la pared: fría, demasiado lisa, como si el edificio te estuviera tomando pulso al revés. Piensas en el roster, en los reclutas que firmaron sabiendo que ‘anomalía’ era una palabra bonita para ‘impredecible’. ¿Cuántos de ellos fingen calma con la misma cara que tú pones ante los pacientes?",
        },
        {
          vnMood: "calm",
          speaker: "Aozora Lin",
          expression: "mirada aguda, hombros bajos — cansancio de quien mide riesgos en silencio",
          portrait: STORY_LIN_PORTRAIT,
          text:
            "—He estado esperando a alguien que no corriera al primer crujido en el techo. —Su voz es baja, casi un murmullo de laboratorio; cada sílaba parece pesada, como si el aire resistiera al sonido del trueno contenido en su tono.— Si vas a serme útil, necesito que dejes de tratarme como ‘civil con suerte’. Llevo tres turnos seguidos mapeando interferencias aquí dentro.",
        },
        {
          vnMood: "calm",
          speaker: "Aozora Lin",
          expression: "sonrisa mínima, ironía seca",
          portrait: STORY_LIN_PORTRAIT,
          text:
            "—Y antes de que lo digas: no, no soy ‘la chica del trueno’ de los memes del cuartel. Soy la que te va a recordar dónde pisa el equipo cuando el suelo miente. —Levanta una ceja.— ¿Todavía tienes café, doctor, o ya lo cambiaste por adrenalina pura?",
        },
        {
          vnMood: "tension",
          speaker: "Narración",
          expression: "luces que tiemblan un instante, sombra alargada",
          text:
            "Oyes pasos que no corresponden a ningún paciente: son el ritmo medido de alguien que ya aprendió a caminar entre anomalías sin romperse el tobillo moral. Cuando giras del todo, el retrato del informe de reclutamiento cobra volumen real: misma mandíbula tensa, mismos ojos que parecen leer frecuencias en lugar de emociones.",
        },
        {
          vnMood: "tension",
          speaker: "Aozora Lin",
          expression: "postura cerrada, mano cerca del pecho — gesto de quien protege un cable interno",
          portrait: STORY_LIN_PORTRAIT,
          text:
            "—El Nudo nos está escuchando. No metafóricamente: hay patrones en el zumbido que coinciden con nuestras palabras. —Traga saliva.— Si me vas a ordenar algo, que sea claro. Si me vas a consolar… que sea breve. No soporto el dramatismo cuando hay trabajo que hacer.",
        },
        {
          vnMood: "tension",
          speaker: "Tú (doctor)",
          expression: "voz contenida, tono profesional",
          text:
            "Asientes. No prometes milagros; no sueltas discursos. Eso, paradójicamente, parece tranquilizarla más que cualquier frase hecha de ‘va a estar bien’. Porque aquí nadie sabe si va a estar bien. Lo que sabes es que puedes elegir cómo fallar si llega el momento.",
        },
      ],
    },
    {
      id: "cap1",
      unlockFloor: 5,
      title: "Capítulo 1 — Primer informe",
      bg: 0,
      vnMood: "tension",
      pages: [
        {
          vnMood: "calm",
          speaker: "Narración",
          expression: "UCI, 03:12, monitor con reflejo verdoso",
          text:
            "El hospital duerme de un modo extraño: con una oreja abierta. Enfermeras cruzan pasillos sin charlar; los zapatos suenan igual que en una película muda. Tú revisas un informe que alguien imprimió ‘por si falla el sistema’. El papel parece más confiable que las pantallas. Hasta que no lo es.",
        },
        {
          vnMood: "calm",
          speaker: "Tú (doctor)",
          expression: "ceño fruncido, ojos en cifras que no cuadran",
          text:
            "Las lecturas deberían ser aburridas: presiones, saturaciones, ritmos. Hoy son un acertijo. Un paciente estable muestra picos como si corriera una maratón en el techo. Otro, grave, tiene una curva tan plana que parece burlarse del sentido común. Anotas, tachas, anotas otra vez.",
        },
        {
          vnMood: "tension",
          speaker: "Narración",
          expression: "parpadeo sincronizado en tres monitores",
          text:
            "Los monitores del pasillo principal parpadean con lecturas imposibles al unísono, un segundo entero, como un parpadeo colectivo del edificio. El olor a antiséptico se vuelve metálico. Una auxiliar murmura que ‘así no estaba en el manual’ y nadie se ríe.",
        },
        {
          vnMood: "tension",
          speaker: "Voz en altavoz",
          expression: "tu timbre, pero no tu aliento",
          text:
            "—Atención: se solicita evacuación ordenada del ala este…—\n\nEl altavoz usa tu cadencia, tu pausa entre palabras. Pero tú no has tocado el micrófono. Alguien a tu lado dice ‘¿Era usted?’ con la cara blanca. Tú niegas con la cabeza y el silencio que sigue pesa más que cualquier mentira reconfortante.",
        },
        {
          vnMood: "tension",
          speaker: "Superviviente (testimonio fragmentado)",
          expression: "voz temblorosa, ojos huidizos",
          text:
            "—En el pasillo B… había… había dos sombras con el mismo abrigo. Una me pidió agua. La otra me pidió nombre…—\n\nOtro testigo contradice sin querer: para uno el pasillo tenía alfombra roja; para otro, baldosas verdes. El Nudo distorsiona identidades y memoria por igual. Tu trabajo deja de ser solo anatomía: empieza a ser coherencia.",
        },
        {
          vnMood: "serious",
          speaker: "Tú (doctor)",
          expression: "mandíbula apretada, decisiones que no caben en un parte",
          text:
            "Guardas el bolígrafo con cuidado exagerado, como ritual. Decides que el informe oficial tendrá una versión ‘limpia’ y tu cuaderno personal otra con lo que realmente oyes. No es paranoia si el edificio repite tu voz sin permiso. Es supervivencia.",
        },
      ],
    },
    {
      id: "cap2",
      unlockFloor: 10,
      title: "Capítulo 2 — Calle comercial",
      bg: 1,
      vnMood: "calm",
      pages: [
        {
          vnMood: "calm",
          speaker: "Narración",
          expression: "escaparates rotos, niebla baja con olor a caramelos quemados",
          text:
            "La calle comercial era el lugar donde la ciudad presumía de normalidad. Ahora los escaparates muestran maniquíes con posturas demasiado humanas y vitrinas que reflejan versiones ligeramente torcidas de quien mira. Cada paso cruje sobre vidrio y propaganda arrancada.",
        },
        {
          vnMood: "calm",
          speaker: "Narración",
          expression: "detalle absurdo que rompe el horror",
          text:
            "Un altavoz de tienda aún repite una oferta de ‘dos por uno’ con voz alegre, desfasada, como burla del tiempo. Un gato callejero te observa desde un mostrador; no huye. En el Nudo, hasta los animales parecen evaluarte antes de moverse.",
        },
        {
          vnMood: "calm",
          speaker: "Civil encapuchado",
          expression: "manos que tiemblan, ojos demasiado claros",
          text:
            "—Tome. No pregunte de dónde salió. —Te entrega un frasco sin etiqueta; el líquido brilla con un tono que no debería existir en farmacología seria.— Sirve para el dolor del alma, dicen. Yo solo sé que después de beberlo… dejé de oír mi nombre en la estática. —Se aleja entre la niebla antes de que puedas tomarle pulso.",
        },
        {
          vnMood: "tension",
          speaker: "Narración",
          expression: "parpadeo: los maniquíes ‘giran’ un milímetro",
          text:
            "Entre escaparates rotos, los maniquíes te siguen con la mirada solo cuando parpadeas. No es truco de luz: es regla del lugar. Aprendes a contar los parpadeos como quien cuenta respiraciones en una crisis. Uno. Dos. Tres. En el cuatro, una figura ya no está donde debería.",
        },
        {
          vnMood: "tension",
          speaker: "Tú (doctor)",
          expression: "mano en el frasco, duda ética punzante",
          text:
            "El frasco pesa poco y, aun así, te parece ilegal en todos los sentidos. Piensas en el juramento, en el laboratorio, en lo que diría tu yo de internado. Luego piensas en los pacientes que no mejoran con ciencia ‘normal’. Guardas el frasco. Todavía no sabes si eso te convierte en salvador o en cómplice.",
        },
        {
          vnMood: "calm",
          speaker: "Narración",
          expression: "atardecer falso, luz que no calienta",
          text:
            "Más adelante, una fuente seca tiene monedas oxidadas como ojos. Alguien ha escrito con tiza: ‘NO MIRES EL AGUA QUE NO ESTÁ’. Decides obedecer. En esta ciudad, a veces la prudencia es la única medicina que queda.",
        },
      ],
    },
    {
      id: "cap3",
      unlockFloor: 15,
      title: "Capítulo 3 — Subestación",
      bg: 2,
      vnMood: "serious",
      pages: [
        {
          vnMood: "serious",
          speaker: "Narración",
          expression: "bajada a servicios, aire denso, zumbido en los dientes",
          text:
            "La subestación no aparece en los mapas turísticos. Aparece en los susurros de técnicos que dejaron de venir y en sellos de ‘PELIGRO’ repintados tantas veces que la pintura forma relieves como cicatrices. Cada escalón hacia abajo te recuerda que la ciudad tiene piso y también pulso.",
        },
        {
          vnMood: "serious",
          speaker: "Técnico fantasma (grabación en walkie)",
          expression: "estática, risa nerviosa al fondo",
          text:
            "—…si el cable ‘suda’, corta el… no, espera, no cortes nada, solo… mierda, ¿me copian?—\n\nLa grabación salta. Oyes tu propia respiración en el pasillo y te odias un segundo por el susto. Los cables en las paredes brillan sin calor, como venas con fiebre de mentira.",
        },
        {
          vnMood: "serious",
          speaker: "Narración",
          expression: "conductos que laten, sombras que se alargan y acortan",
          text:
            "Cables arden sin calor. La ciudad parece tener otra ciudad debajo: conductos que laten como venas, válvulas que susurran nombres que no son tuyos. El aire vibra en la frente. Aquí el juramento médico choca con la necesidad de atravesar la anomalía hasta el origen del pulso falso.",
        },
        {
          vnMood: "tension",
          speaker: "Tú (doctor)",
          expression: "sudor frío, determinación quieta",
          text:
            "Te detienes ante una arqueta marcada con un símbolo que no recuerdas haber visto en ningún curso. Huele a ozono y a papel mojado. Piensas en los que arriba esperan una explicación limpia. Les debes la verdad… o al menos una mentira que los mantenga vivos hasta mañana.",
        },
        {
          vnMood: "serious",
          speaker: "Narración",
          expression: "puerta de servicio al ‘núcleo’ simbólico",
          text:
            "Una luz de emergencia parpadea en rojo, pero el pasillo suena azul. El Nudo juega con sentidos cruzados. Anotas el fenómeno: no para el paper, sino para no volverte loco. La cordura, aquí, es también protocolo.",
        },
      ],
    },
    {
      id: "cap4",
      unlockFloor: 20,
      title: "Capítulo 4 — Núcleo frío",
      bg: 0,
      vnMood: "serious",
      pages: [
        {
          vnMood: "serious",
          speaker: "Narración",
          expression: "sala amplia, eco que repite palabras medio segundo tarde",
          text:
            "El ‘núcleo’ no es un artefacto brillante de ciencia ficción: es un silencio demasiado ordenado, como quirófano antes de la primera incisión. Las paredes sudan condensación. Cada gota sigue un ritmo. No es aleatorio. Nada aquí lo es.",
        },
        {
          vnMood: "serious",
          speaker: "Voz estática",
          expression: "susurro que ensambla sílabas como piezas de rompecabezas",
          text:
            "—…coordenadas… no… tuyas… firma…—\n\nLa voz ensambla fragmentos. Entre líneas, crees oír tu nombre deletreado con la paciencia de quien repite una lección hasta que el alumno rompa. Aprietas los puños. Respiras lento. El miedo es contagioso; la calma también.",
        },
        {
          vnMood: "serious",
          speaker: "Narración",
          expression: "pacientes rescatados, mismos ojos vacíos al despertar",
          text:
            "Los que salvaste empiezan a recordar el mismo sueño: un pasillo, una puerta, una pregunta que no tiene respuesta corta. No es epidemia clásica; es sincronía del trauma. Tu intervención ya no basta con vendas: necesitas sentido, aunque duela.",
        },
        {
          vnMood: "tension",
          speaker: "Tú (doctor)",
          expression: "voz ronca, furia contenida",
          text:
            "—Si alguien usa mi nombre, que se presente. —El eco devuelve la frase casi burlón, como si el lugar te citara a juicio. Entiendes, de golpe, que el fondo del Nudo no es un sitio: es un acuerdo colectivo roto, y alguien sigue firmando con tinta que huele a hospital y ceniza.",
        },
        {
          vnMood: "serious",
          speaker: "Narración",
          expression: "amanecer gris tras la puerta",
          text:
            "Subes de nuevo hacia la luz verdosa del pasillo. No has ganado; has sobrevivido a una capa más del problema. Eso, en este oficio, a veces cuenta como victoria. Guardas el bolígrafo. El siguiente informe tendrá una línea en blanco al final, para lo que aún no tiene nombre.",
        },
      ],
    },
  ];

  function tryPlayAudio(el, urls, label) {
    if (!el || !urls || !urls.length) return;
    let i = 0;
    function next() {
      if (i >= urls.length) return;
      el.src = urls[i++];
      el.load();
      el.play().catch(() => next());
    }
    el.dataset.label = label || "";
    next();
  }

  function setBodyBg() {
    for (const u of BG_PAGE) {
      const img = new Image();
      img.onload = () => {
        document.body.style.setProperty("--page-bg-img", `url("${u}")`);
      };
      img.src = u;
    }
  }

  /** Único set de ejemplo en app: Draconyr Pyro. El resto del catálogo público va en data/patimon-catalog.json */
  const DEFAULT_EQUIP = [
    {
      id: "def-draco-pyro-cabeza",
      slot: "Cabeza",
      name: "Draconyr Pyro — Yelmo escamas ígneas",
      setId: "draconyr_pyro",
      element: "Fuego",
      descPiece: "Casco ligero con placas como ascuas alineadas; canaliza calor hacia el golpe sin quemar al portador.",
      stats: { HP: 22, SP: 10, STG: 14, DX: 5, VI: 10, MA: 8, EN: 8, AG: 6, LUK: 3 },
      subStatsDesc: "Bonos menores de pieza: STG y MA ígneo al subir EXP con esta pieza equipada.",
      setBonus: "Set Draconyr Pyro completo: daño ofensivo ígneo elevado; el elemento potencia el conjunto.",
      skill: {
        name: "Aliento de forja",
        sp: 22,
        cd: 4,
        uses: 2,
        dmg: "Área: 200% STG + 45% MA como ígneo",
        cond: "Las 4 piezas draconyr_pyro equipadas.",
        desc: "Onda de calor; penaliza DEF física enemiga brevemente.",
      },
      imageUrl: "Patimon/placeholder.png",
    },
    {
      id: "def-draco-pyro-cuerpo",
      slot: "Cuerpo",
      name: "Draconyr Pyro — Coraza horno vivo",
      setId: "draconyr_pyro",
      element: "Fuego",
      descPiece: "Peto con núcleo térmico contenido; vibra cuando el combate se alarga.",
      stats: { HP: 38, SP: 12, STG: 10, DX: 6, VI: 16, MA: 6, EN: 14, AG: 5, LUK: 3 },
      subStatsDesc: "Bonos menores: VI y EN; aguanta golpes mientras cargas el set.",
      setBonus: "Set Draconyr Pyro completo: daño ofensivo ígneo elevado; el elemento potencia el conjunto.",
      skill: {
        name: "Aliento de forja",
        sp: 22,
        cd: 4,
        uses: 2,
        dmg: "Área: 200% STG + 45% MA como ígneo",
        cond: "Las 4 piezas draconyr_pyro equipadas.",
        desc: "Onda de calor; penaliza DEF física enemiga brevemente.",
      },
      imageUrl: "Patimon/placeholder.png",
    },
    {
      id: "def-draco-pyro-arma",
      slot: "Arma",
      name: "Draconyr Pyro — Lanza brasas",
      setId: "draconyr_pyro",
      element: "Fuego",
      descPiece: "Arma larga con filo que deja estelas de calor; favorece entradas agresivas.",
      stats: { HP: 12, SP: 8, STG: 24, DX: 11, VI: 8, MA: 5, EN: 6, AG: 8, LUK: 4 },
      subStatsDesc: "Bonos menores: STG y DX; críticos ligeros si el set no está completo.",
      setBonus: "Set Draconyr Pyro completo: daño ofensivo ígneo elevado; el elemento potencia el conjunto.",
      skill: {
        name: "Aliento de forja",
        sp: 22,
        cd: 4,
        uses: 2,
        dmg: "Área: 200% STG + 45% MA como ígneo",
        cond: "Las 4 piezas draconyr_pyro equipadas.",
        desc: "Onda de calor; penaliza DEF física enemiga brevemente.",
      },
      imageUrl: "Patimon/placeholder.png",
    },
    {
      id: "def-draco-pyro-acc",
      slot: "Accesorio",
      name: "Draconyr Pyro — Broche hornacina",
      setId: "draconyr_pyro",
      element: "Fuego",
      descPiece: "Sello metálico que armoniza el flujo ígneo entre las cuatro ranuras.",
      stats: { HP: 14, SP: 22, STG: 6, DX: 5, VI: 8, MA: 16, EN: 9, AG: 7, LUK: 7 },
      subStatsDesc: "Bonos menores: SP y MA; recupera un poco de SP al derrotar enemigos menores.",
      setBonus: "Set Draconyr Pyro completo: daño ofensivo ígneo elevado; el elemento potencia el conjunto.",
      skill: {
        name: "Aliento de forja",
        sp: 22,
        cd: 4,
        uses: 2,
        dmg: "Área: 200% STG + 45% MA como ígneo",
        cond: "Las 4 piezas draconyr_pyro equipadas.",
        desc: "Onda de calor; penaliza DEF física enemiga brevemente.",
      },
      imageUrl: "Patimon/placeholder.png",
    },
  ];

  const FLOOR_20_REWARD_SETS = [
    {
      id: "draconyr_pyro",
      label: "Equipamiento especial Draconyr Pyro",
      desc: "Set ofensivo: el daño bruto es el foco. Según cómo el GM encaje tu elemento en la campaña, el conjunto puede volverse aún más letal.",
    },
    {
      id: "draconyr_gyro",
      label: "Draconyr Gyro",
      desc: "Variante ofensiva alineada con velocidad y trueno: golpes encadenados y presión constante. Misma filosofía que Pyro, distinta tonalidad elemental.",
    },
    {
      id: "draconyr_aquno",
      label: "Draconyr Aquno",
      desc: "Variante ofensiva fría y fluida: control del campo y desgaste. Ideal si quieres castigar sin ceder terreno.",
    },
    {
      id: "exosister",
      label: "Exosister",
      desc: "Para quienes buscan magia elemental pura y sintetizar poderes únicos capaces de borrar amenazas mayores.",
    },
    {
      id: "john",
      label: "John",
      desc: "Pensado para jugadores muy exigentes: apuesta fuerte por la suerte y combos raros. También encaja bien en personajes de apoyo que quieran sorprender.",
    },
    {
      id: "luciernaga",
      label: "Luciérnaga",
      desc: "Set centrado en sanación y sostener al equipo: prioriza mantener vivos a los demás antes que brillar en el daño.",
    },
    {
      id: "goliath",
      label: "Goliath",
      desc: "Si te gusta ser un muro casi impenetrable, absorber golpes y anclar la línea, este es tu estilo.",
    },
    {
      id: "gaga_slayer",
      label: "Gaga Slayer",
      desc: "Especialistas en daño a distancia y eliminar objetivos con precisión; asesinos de campo abierto.",
    },
  ];

  const STORAGE_EQUIP = "kbk_equip_custom_v1";
  /** Catálogo compartido (GitHub Pages): mismo origen que la página. Sustituye el archivo al exportar y hacer commit. */
  const PATIMON_CATALOG_URL = "data/patimon-catalog.json";
  let patimonRemoteCatalog = [];
  const STORAGE_LOTG_LEGACY = "lotg_save_v1";
  const STORAGE_LOTG = "lotg_save_v2";
  const LOTG_PROTAG_FALLBACK_DATA_URL =
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect fill="#24283a" width="96" height="96" rx="12"/><text x="48" y="54" fill="#8b95a8" text-anchor="middle" font-size="13">?</text></svg>'
    );
  const LOTG_COMBAT_PROTAG_FALLBACK_DATA_URL =
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88"><rect fill="#333" width="88" height="88"/><text x="44" y="50" fill="#fff" text-anchor="middle" font-size="14">P</text></svg>'
    );

  const GACHA_UNITS = [
    {
      name: "Kiyama Reika",
      img: "Char/KiyamaAwakening.png",
      rarity: "SSS",
      element: "Fuego",
      role: "DPS Mágico",
      promo: true,
      passive: { name: "Corona de ceniza perpetua", desc: "Tras usar la habilidad, +12% daño ígneo durante 2 turnos propios del grupo." },
      skill: {
        name: "Rastro del amanecer roto",
        sp: 26,
        cd: 5,
        dmg: "Área: 210% MA ígneo a todos los fragmentos",
        desc: "Ultimate: onda expansiva; aplica Quemadura leve (−8% DEF enemiga, 2 turnos).",
      },
    },
    {
      name: "Akamine Toru",
      img: "Char/Zenitsu.png",
      rarity: "S",
      element: "Trueno",
      role: "DPS Físico",
      passive: { name: "Canal resonante", desc: "+6% probabilidad de crítico en ataques físicos del grupo." },
      skill: { name: "Línea Godspeed — eco urbano", sp: 18, cd: 3, dmg: "5× 45% STG trueno", desc: "Ráfaga; cada golpe puede encadenar (+5% daño si el anterior crítico)." },
    },
    {
      name: "Hanazawa Yui",
      img: "Char/Hishinaga.png",
      rarity: "A",
      element: "Neutral",
      role: "Healer",
      passive: { name: "Campo de sutura", desc: "Al final del turno enemigo, el aliado más herido recupera 4% HP máx." },
      skill: { name: "Bálsamo de superposición", sp: 16, cd: 2, dmg: "Cura 28% HP grupo", desc: "Sanación en área; limpia 1 penalizador leve de DEF del equipo." },
    },
    {
      name: "Kurosaki Ren",
      img: "Char/Gilgamesh.png",
      rarity: "A",
      element: "Neutral",
      role: "DPS Mágico",
      passive: { name: "Eclipse interior", desc: "+8% daño mágico si el enemigo tiene más de 70% HP." },
      skill: { name: "Llave del vacío menor", sp: 20, cd: 4, dmg: "220% MA a horda", desc: "Daño cuántico en área; roba 12 SP del objetivo principal." },
    },
    {
      name: "Mizuno Sora",
      img: "Char/Corin.png",
      rarity: "A",
      element: "Hielo",
      role: "Soporte",
      passive: { name: "Humedad anclada", desc: "+6% reducción de daño físico recibido por aliados en combate." },
      skill: { name: "Tarot XIV — niebla de hielo", sp: 14, cd: 3, dmg: "Debuff: −10% precisión enemiga (3 turnos)", desc: "Persona-tir: Niebla clínica; el siguiente ataque aliado +15% daño." },
    },
    {
      name: "Tachibana Ken",
      img: "Char/Dekota.png",
      rarity: "A",
      element: "Fuego",
      role: "DPS Físico",
      passive: { name: "Ímpetu de callejón", desc: "+12% daño físico contra enemigos por debajo del 50% HP." },
      skill: { name: "Agneyastra — derribo cívico", sp: 14, cd: 2, dmg: "2× 98% STG ígneo", desc: "Ráfaga ígnea; el segundo golpe +22% si el primero impacta." },
    },
    {
      name: "Shirase Mio",
      img: "Char/Ellen.png",
      rarity: "A",
      element: "Hielo",
      role: "DPS Mágico",
      passive: { name: "Lágrima estática", desc: "Los críticos mágicos aplican Escarcha (−5% AG enemiga, 2 turnos)." },
      skill: { name: "Frijol perpetuo — calle sin salida", sp: 18, cd: 3, dmg: "175% MA hielo área", desc: "Ralentiza; enemigos afectados reciben +10% daño de Trueno." },
    },
    {
      name: "Nishimura Hayato",
      img: "Char/Sun.png",
      rarity: "S",
      element: "Trueno",
      role: "Soporte",
      passive: { name: "Vectores de huida", desc: "+7% esquiva del doctor y aliados en combate." },
      skill: { name: "Sobrecarga — paso del nudo", sp: 15, cd: 4, dmg: "Buff: +12% AG equipo (4 turnos)", desc: "Aumenta esquiva y velocidad de turno aliado percibida." },
    },
    {
      name: "Fujita Anna",
      img: "Char/Thoma.png",
      rarity: "S",
      element: "Fuego",
      role: "DPS Físico",
      passive: { name: "Seguro roto", desc: "+6% daño por cada enemigo vivo en la horda (máx. +18%)." },
      skill: { name: "Rastro de Kafka — perímetro cero", sp: 16, cd: 3, dmg: "168% STG ígneo", desc: "Disparo sellado; ignora 12% de DEF física." },
    },
    {
      name: "Aozora Lin",
      img: "Char/Lawliet.png",
      rarity: "A",
      element: "Trueno",
      role: "Soporte",
      passive: { name: "Índice de interferencias", desc: "+15 SP al doctor al entrar en combate." },
      passiveHook: "doctorSp15",
      skill: { name: "Faraday improvisado", sp: 13, cd: 3, dmg: "130% MA trueno + aturdir leve", desc: "Interrumpe cadencias enemigas; +8% daño Trueno siguiente turno." },
    },
    { name: "Kisaragi Eve", img: "Char/LawlietG.png", rarity: "A", element: "Hielo", role: "DPS Mágico",
      passive: { name: "Cristal de contrato", desc: "+10% MA si hay 2+ enemigos en campo." },
      skill: { name: "Sentencia — subcero urbano", sp: 19, cd: 4, dmg: "195% MA hielo", desc: "Golpe focal; aplica Vulnerabilidad mágica +8% (2 turnos)." } },
    { name: "Morimoto Vex", img: "Char/Firefly.png", rarity: "SS", element: "Neutral", role: "DPS Mágico",
      passive: { name: "Motor de anomalía", desc: "Cada habilidad aliada usada +2% daño mágico acumulable (máx. 22%)." },
      skill: { name: "Stellaron — colapso de fase (calle 7)", sp: 22, cd: 5, dmg: "255% MA área", desc: "Daño cuántico masivo; consume 5% HP propio para +18% penetración." } },
    {
      name: "Ventura Aoi",
      img: "Char/Aventurino.png",
      rarity: "A",
      element: "Trueno",
      role: "Soporte",
      passive: { name: "Mapa de rutas rotas", desc: "+6% daño de Trueno del equipo tras usar objeto en combate." },
      skill: { name: "Farol de encrucijada", sp: 15, cd: 3, dmg: "140% MA trueno", desc: "Marca al jefe de la horda; recibe +10% daño de todos los elementos (2 turnos)." },
    },
    {
      name: "Dorian Vale",
      img: "Char/Dorian.png",
      rarity: "S",
      element: "Hielo",
      role: "DPS Mágico",
      passive: { name: "Espejo de asfalto", desc: "+8% MA contra enemigos con debuff." },
      skill: { name: "Catedral de cristal líquido", sp: 20, cd: 4, dmg: "205% MA hielo área", desc: "Congela cadencias; aplica Fractura mágica −12% RES (2 turnos)." },
    },
    {
      name: "Kozue Dosh",
      img: "Char/Dosh.png",
      rarity: "B",
      element: "Neutral",
      role: "DPS Físico",
      passive: { name: "Cobro en efectivo", desc: "+10% STG contra objetivos por encima del 75% HP." },
      skill: { name: "Martillo de contención", sp: 14, cd: 2, dmg: "155% STG", desc: "Golpe brutal; +15% daño si el enemigo está por encima del 75% HP." },
    },
    {
      name: "Gamha Ire",
      img: "Char/Gamha.png",
      rarity: "A",
      element: "Fuego",
      role: "DPS Físico",
      passive: { name: "Calor de fundición", desc: "+5% daño ígneo por enemigo en horda (máx. +15%)." },
      skill: { name: "Ola térmica — distrito industrial", sp: 18, cd: 3, dmg: "170% STG ígneo área", desc: "Quemadura intensa; −10% DEF física objetivos (2 turnos)." },
    },
    {
      name: "Amane Grace",
      img: "Char/Grace.png",
      rarity: "A",
      element: "Neutral",
      role: "Healer",
      passive: { name: "Protocolo de triage", desc: "Al usar habilidad, cura extra 6% HP máx. al aliado más bajo." },
      skill: { name: "Sala cero — esterilización", sp: 17, cd: 3, dmg: "Cura 22% HP grupo", desc: "Limpia 1 efecto de penalización de precisión o esquiva en el equipo." },
    },
    {
      name: "Amane Grace — Despertar",
      img: "Char/GraceAwakaening.png",
      rarity: "SSS",
      element: "Hielo",
      role: "Healer",
      promo: true,
      passive: { name: "Halo clínico absoluto", desc: "Las curaciones del grupo +10% eficacia durante 3 turnos tras tu ultimate." },
      skill: { name: "Renacimiento en hielo seco", sp: 28, cd: 6, dmg: "Cura 38% HP + escudo 12% máx.", desc: "Ultimate: inmunidad breve a Quemadura/Escarcha leve en aliados (1 turno)." },
    },
    {
      name: "Hayasaka Mirei",
      img: "Char/Hayasaka.png",
      rarity: "A",
      element: "Trueno",
      role: "DPS Mágico",
      passive: { name: "Pulsos paralelos", desc: "+9% MA en el primer turno de combate." },
      skill: { name: "Myriad Celestia — cableado invertido", sp: 16, cd: 3, dmg: "172% MA trueno", desc: "Encadena al segundo enemigo vivo por 38% del daño." },
    },
    {
      name: "Hintake Ren",
      img: "Char/Hintake.png",
      rarity: "A",
      element: "Hielo",
      role: "Soporte",
      passive: { name: "Capa de aguanieve", desc: "+7% reducción de daño ígneo recibido por el grupo." },
      skill: { name: "Marcha del traidor — barrera de deshielo", sp: 13, cd: 3, dmg: "Buff: +12% RES mágica (3 turnos)", desc: "Mitiga estallidos; siguiente ataque enemigo −10% si es Fuego." },
    },
    {
      name: "Hintoki Sou",
      img: "Char/Hintoki.png",
      rarity: "A",
      element: "Fuego",
      role: "DPS Mágico",
      passive: { name: "Brasas en el conducto", desc: "+10% MA si el enemigo principal tiene Escarcha o debuff de hielo." },
      skill: { name: "Incendio controlado — bloque B", sp: 19, cd: 4, dmg: "188% MA ígneo", desc: "Área reducida pero alta intensidad; +12% si hay 2+ enemigos." },
    },
    {
      name: "Homura Kise",
      img: "Char/Homura.png",
      rarity: "S",
      element: "Fuego",
      role: "DPS Mágico",
      passive: { name: "Lente de calor residual", desc: "Los críticos mágicos +15% daño ígneo en el siguiente ataque del mismo objetivo." },
      skill: { name: "Línea de fuego amigo", sp: 21, cd: 4, dmg: "215% MA ígneo línea", desc: "Aplica Combustión: +8% daño recibido de Hielo y Trueno (2 turnos)." },
    },
    {
      name: "Kabal Lynx",
      img: "Char/Kabal.png",
      rarity: "A",
      element: "Neutral",
      role: "DPS Físico",
      passive: { name: "Garras de titanio reciclado", desc: "+8% penetración de DEF física simulada en texto de combate." },
      skill: { name: "Salto de tejado — tercer riel", sp: 15, cd: 2, dmg: "2× 88% STG", desc: "Dos golpes; el segundo favorece crítico (+12% tasa)." },
    },
    {
      name: "Kiyama Non",
      img: "Char/Kiyama.png",
      rarity: "B",
      element: "Fuego",
      role: "Soporte",
      passive: { name: "Brasa comunitaria", desc: "+5% STG a aliados después de tu turno de habilidad." },
      skill: { name: "Muro de chispas", sp: 14, cd: 3, dmg: "120% MA ígneo + provocación narrativa", desc: "Enfoca la horda; el doctor +10% esquiva 1 turno." },
    },
    {
      name: "Kokonota Mie",
      img: "Char/Kokonota.png",
      rarity: "B",
      element: "Neutral",
      role: "Soporte",
      passive: { name: "Ecos en el pasillo", desc: "+4 SP al doctor cuando esta unidad usa pasar en combate." },
      skill: { name: "Bucle de notas perdidas", sp: 12, cd: 2, dmg: "Debuff: −8% ATK enemigo (2 turnos)", desc: "Prioriza al líder de la horda si existe." },
    },
    {
      name: "Kon Shigeru",
      img: "Char/Kon.png",
      rarity: "A",
      element: "Trueno",
      role: "DPS Físico",
      passive: { name: "Reflejo en el charco", desc: "+6% esquiva propia y +4% del grupo." },
      skill: { name: "Rayo en cadena — callejón", sp: 17, cd: 3, dmg: "175% STG trueno", desc: "Salto al siguiente enemigo por 40% si el primero cae por debajo del 40% HP." },
    },
    {
      name: "Kaname Mio",
      img: "Char/Madoka.png",
      rarity: "S",
      element: "Hielo",
      role: "Soporte",
      passive: { name: "Pacto de linterna", desc: "Al curar, aplica Velo +5% RES todo elemento 2 turnos." },
      skill: { name: "Arco de deseos — versión urbana", sp: 18, cd: 4, dmg: "Cura 18% + 130% MA hielo", desc: "Sanación y golpe; congela parcialmente (−6% AG, 2 turnos)." },
    },
    {
      name: "Masato Jin",
      img: "Char/Masato.png",
      rarity: "B",
      element: "Neutral",
      role: "DPS Físico",
      passive: { name: "Ritmo de metro fantasma", desc: "+10% STG contra Neutral." },
      skill: { name: "Combo de andén", sp: 14, cd: 2, dmg: "3× 52% STG", desc: "Ráfaga; cada impacto +5% si el anterior fue crítico." },
    },
    {
      name: "Metsuda Rei",
      img: "Char/Metsuda.png",
      rarity: "A",
      element: "Trueno",
      role: "DPS Mágico",
      passive: { name: "Condensador urbano", desc: "+12% MA trueno tras recibir daño mágico (1 vez por combate)." },
      skill: { name: "Torre de relés — sobrecarga", sp: 20, cd: 4, dmg: "198% MA trueno área", desc: "Paralización narrativa; enemigos −10% precisión (2 turnos)." },
    },
    {
      name: "Ragna Voss",
      img: "Char/Ragna.png",
      rarity: "A",
      element: "Hielo",
      role: "DPS Físico",
      passive: { name: "Filos de ventisca", desc: "+8% STG contra enemigos bajo 50% HP." },
      skill: { name: "Corte de turbina", sp: 16, cd: 3, dmg: "185% STG hielo", desc: "Aplica Escarcha profunda; +10% daño Fuego recibido por el objetivo (interacción elemental)." },
    },
    {
      name: "Ragna Voss — Stormbreaker",
      img: "Char/Ragnastorm breaker.png",
      rarity: "S",
      element: "Trueno",
      role: "DPS Físico",
      passive: { name: "Rompetormentas", desc: "+15% STG trueno si hay 3+ enemigos en campo." },
      skill: { name: "Fisura del frente frío", sp: 22, cd: 5, dmg: "230% STG trueno área", desc: "Golpe masivo; empuja la ventaja elemental +8% daño extra si debilitas Hielo." },
    },
    {
      name: "Shirakawa Miko",
      img: "Char/Reimu.png",
      rarity: "S",
      element: "Neutral",
      role: "DPS Mágico",
      passive: { name: "Barrera de ofrendas digitales", desc: "+10% MA en oleadas (combates con 2+ enemigos)." },
      skill: { name: "Fantasma — limpieza de distrito", sp: 19, cd: 4, dmg: "210% MA área", desc: "Daño espectral; roba 8 SP del enemigo con más HP%." },
    },
    {
      name: "Ryouga Taiga",
      img: "Char/Ryouga.png",
      rarity: "B",
      element: "Trueno",
      role: "DPS Físico",
      passive: { name: "Instinto de perro callejero", desc: "+12% crítico físico cuando tu HP está por debajo del 45%." },
      skill: { name: "Zarpazo cargado", sp: 15, cd: 3, dmg: "168% STG trueno", desc: "Si mata al objetivo, +10% STG siguiente ataque." },
    },
    {
      name: "Sho Arata",
      img: "Char/Sho.png",
      rarity: "A",
      element: "Hielo",
      role: "DPS Físico",
      passive: { name: "Silencio en la nieve negra", desc: "+7% daño a enemigos afectados por debuffs de precisión." },
      skill: { name: "Hoja de aire acondicionado roto", sp: 17, cd: 3, dmg: "172% STG hielo", desc: "Ataque único; +20% si el enemigo es Fuego (triángulo)." },
    },
    {
      name: "Soka Miri",
      img: "Char/Soka.png",
      rarity: "B",
      element: "Neutral",
      role: "Healer",
      passive: { name: "Té de refugio", desc: "Las curaciones +6% en combates de jefe (piso múltiplo de 5)." },
      skill: { name: "Vapor reconfortante", sp: 15, cd: 2, dmg: "Cura 20% HP aliado más bajo", desc: "Regenera 4% HP máx. al doctor." },
    },
    {
      name: "Soren Val",
      img: "Char/Soren.png",
      rarity: "A",
      element: "Hielo",
      role: "DPS Mágico",
      passive: { name: "Biblioteca congelada", desc: "+8% MA hielo si el doctor tiene SP por encima del 50%." },
      skill: { name: "Índice de cristal", sp: 18, cd: 4, dmg: "192% MA hielo", desc: "Marca objetivo; aliados Trueno +10% daño contra él (2 turnos)." },
    },
    {
      name: "Sori Lune",
      img: "Char/Sori.png",
      rarity: "B",
      element: "Hielo",
      role: "Soporte",
      passive: { name: "Marea descendente", desc: "+5% MA de todo el grupo tras Escarcha en enemigo." },
      skill: { name: "Ola bajo el neón", sp: 14, cd: 3, dmg: "135% MA hielo + ralentizar", desc: "−10% AG enemiga (2 turnos)." },
    },
    {
      name: "Stone Kaito",
      img: "Char/Stone.png",
      rarity: "A",
      element: "Neutral",
      role: "DPS Físico",
      passive: { name: "Piel de hormigón bendecido", desc: "−8% daño físico recibido (narrativo en descripción de tanque)." },
      skill: { name: "Maza de obra — cimientos", sp: 16, cd: 3, dmg: "160% STG + empuje", desc: "Aturdimiento leve al objetivo principal; −12% su STG 1 turno." },
    },
    {
      name: "Sunoichi Taro",
      img: "Char/Sunoichi.png",
      rarity: "S",
      element: "Trueno",
      role: "DPS Físico",
      passive: { name: "Sombra del mercado negro", desc: "+10% daño trueno tras esquivar (1 vez por ronda enemiga)." },
      skill: { name: "Corte silencioso — kilovatio", sp: 20, cd: 4, dmg: "200% STG trueno", desc: "Ignora 15% DEF si el objetivo tiene debuff." },
    },
    {
      name: "Sura Neon",
      img: "Char/Sura.png",
      rarity: "B",
      element: "Fuego",
      role: "DPS Mágico",
      passive: { name: "Letreros en llamas", desc: "+6% MA ígneo por cada aliado vivo." },
      skill: { name: "Publicidad ardiente", sp: 15, cd: 3, dmg: "162% MA ígneo área", desc: "Quemadura de marca; +5% daño recibido del doctor 2 turnos." },
    },
    {
      name: "Terumi Kame",
      img: "Char/Terumikame.png",
      rarity: "B",
      element: "Neutral",
      role: "Healer",
      passive: { name: "Caparazón compartido", desc: "+8% curación en aliados por debajo del 35% HP." },
      skill: { name: "Manantial bajo el asfalto", sp: 16, cd: 3, dmg: "Cura 24% grupo", desc: "Escudo 6% HP máx. al doctor." },
    },
    {
      name: "Toa Mira",
      img: "Char/Toa.png",
      rarity: "A",
      element: "Trueno",
      role: "Soporte",
      passive: { name: "Antena de barrio", desc: "+5% precisión del grupo contra hordas." },
      skill: { name: "Señal de auxilio amplificada", sp: 14, cd: 3, dmg: "125% MA trueno + buff", desc: "+12% MA aliados siguiente turno." },
    },
    {
      name: "Tsuki Ren",
      img: "Char/Tsuki.png",
      rarity: "S",
      element: "Hielo",
      role: "DPS Mágico",
      passive: { name: "Mareas lunares", desc: "Cada tercer ataque mágico +18% daño hielo." },
      skill: { name: "Eclipse sobre el distrito", sp: 21, cd: 5, dmg: "225% MA hielo", desc: "Congela parcialmente la horda; vulnerabilidad +10% a Trueno (2 turnos)." },
    },
    {
      name: "Yeshpir Sol",
      img: "Char/Yesjpir.png",
      rarity: "B",
      element: "Neutral",
      role: "DPS Mágico",
      passive: { name: "Firma ilegible", desc: "+7% MA contra enemigos Neutral." },
      skill: { name: "Glifo de grafito cuántico", sp: 17, cd: 4, dmg: "178% MA", desc: "Daño único; −10% RES mágica objetivo (2 turnos)." },
    },
    {
      name: "Ylilea Nox",
      img: "Char/Ylilea.png",
      rarity: "A",
      element: "Neutral",
      role: "DPS Mágico",
      passive: { name: "Sutura del vacío", desc: "+10% MA si ningún aliado murió en el combate actual." },
      skill: { name: "Pozo sin fondo — calle 9", sp: 19, cd: 4, dmg: "195% MA", desc: "Drena 6% HP propio para +20% penetración mágica en el golpe." },
    },
    {
      name: "Yoshikawa Taka",
      img: "Char/Yoshi.png",
      rarity: "B",
      element: "Fuego",
      role: "DPS Físico",
      passive: { name: "Turbo de barrio", desc: "+8% STG ígneo en la primera mitad del combate." },
      skill: { name: "Quemado de neumáticos", sp: 14, cd: 2, dmg: "158% STG ígneo", desc: "Rastro de fuego; siguiente ataque aliado +8% daño al mismo objetivo." },
    },
    {
      name: "Youli Chen",
      img: "Char/Youli.png",
      rarity: "A",
      element: "Hielo",
      role: "Soporte",
      passive: { name: "Red de frío distribuido", desc: "+6% RES hielo del equipo." },
      skill: { name: "Nodo de climatización", sp: 15, cd: 3, dmg: "Buff +10% DEF mágica (3 turnos)", desc: "Reduce daño de área enemiga en narrativa de combate." },
    },
    {
      name: "Zera Null",
      img: "Char/Zera.png",
      rarity: "S",
      element: "Neutral",
      role: "DPS Mágico",
      passive: { name: "Anulación de ruido", desc: "+12% MA si la horda tiene tipos de elemento mezclados." },
      skill: { name: "Punto cero — ciudad dormida", sp: 23, cd: 5, dmg: "248% MA cuántico área", desc: "Resetea narrativamente debuffs leves propios a cambio de daño masivo." },
    },
  ];

  const ENEMY_TEMPLATES = [
    { name: "Vitrina sin juicio", tag: "Nexo Δ-11", element: "Hielo" },
    { name: "Ascensor que susurra pisos", tag: "Torre sellada", element: "Trueno" },
    { name: "Memoria de asfalto húmedo", tag: "Cicatriz urbana", element: "Neutral" },
    { name: "Custodio de cable pelado", tag: "Subestación fantasma", element: "Trueno" },
    { name: "Horda de etiquetas RFID", tag: "Basura cognitiva", element: "Neutral" },
    { name: "Fiebre del quiosco 24h", tag: "Comercio errante", element: "Fuego" },
    { name: "Eco de megafonía rota", tag: "Propaganda persistente", element: "Trueno" },
    { name: "Sombra de torniquete", tag: "Metro sellado", element: "Hielo" },
    { name: "Fragmento de pantalla azul", tag: "Glitch municipal", element: "Neutral" },
    { name: "Ducto que respira ozono", tag: "Ventilación maldita", element: "Fuego" },
    { name: "Firma ilegible del edificio", tag: "Notaría del vacío", element: "Neutral" },
    { name: "Latido de transformador", tag: "Red hambrienta", element: "Trueno" },
    { name: "Mancha de neón persistente", tag: "Distrito sin ley", element: "Fuego" },
    { name: "Archivo mojado del sótano", tag: "Biblioteca sumergida", element: "Hielo" },
    { name: "Vigía de perro mecánico", tag: "Patrulla oxidada", element: "Neutral" },
    { name: "Semilla de Fragmentum errante", tag: "Coral cuántico", element: "Neutral" },
    { name: "Ecos de Viento estelar", tag: "Expedición perdida", element: "Trueno" },
    { name: "Gólem de datos Imaginarios", tag: "Archivo sellado", element: "Neutral" },
    { name: "Lámpara de Abundancia rota", tag: "Oración estática", element: "Hielo" },
    { name: "Fagocito de la Nihilidad", tag: "Vacío municipal", element: "Fuego" },
    { name: "Taxi sin destino en GPS", tag: "Ruta fantasma", element: "Neutral" },
    { name: "Bocina de tráfico eterno", tag: "Ruido agudo", element: "Trueno" },
    { name: "Charco que refleja otro cielo", tag: "Espejo urbano", element: "Hielo" },
    { name: "Cajero que devuelve miedo", tag: "Finanzas malditas", element: "Neutral" },
    { name: "Graffiti que susurra tu nombre", tag: "Firma etérea", element: "Imaginario" },
    { name: "Puerta de incendios sellada", tag: "Salida negada", element: "Fuego" },
    { name: "Dron de vigilancia sin dueño", tag: "Ojo ciego", element: "Trueno" },
    { name: "Sombrero olvidado en el metro", tag: "Ancla mnémica", element: "Neutral" },
    { name: "Mensaje de voz a nadie", tag: "Eco digital", element: "Trueno" },
    { name: "Barista de un bar cerrado", tag: "Servicio imposible", element: "Fuego" },
    { name: "Sirena de ambulancia en bucle", tag: "Urgencia simulada", element: "Neutral" },
    { name: "Escalera mecánica al piso −1", tag: "Descenso lógico", element: "Hielo" },
    { name: "Tótem de cupones caducados", tag: "Economía residual", element: "Neutral" },
    { name: "Perro de tres cabezas (pegatina)", tag: "Bestia urbana", element: "Fuego" },
    { name: "Túnel que huele a mar lejano", tag: "Corriente salada", element: "Hielo" },
    { name: "Semáforo en ámbar perpetuo", tag: "Indecisión cívica", element: "Trueno" },
    { name: "Cámara de seguridad sonriente", tag: "Voyeur cósmico", element: "Neutral" },
    { name: "Maniquí con tu postura", tag: "Doble incómodo", element: "Imaginario" },
    { name: "Hoja de té que no se moja", tag: "Contrato húmedo", element: "Hielo" },
    { name: "Batería portátil al 0% eterno", tag: "Energía fantasma", element: "Trueno" },
    { name: "Felicitación de cumpleaños a extranjero", tag: "Afecto erróneo", element: "Neutral" },
    { name: "Cristal blindado con una grieta", tag: "Vulnerabilidad fina", element: "Fuego" },
    { name: "Ecosistema de cucarachas sabias", tag: "Biología subterránea", element: "Neutral" },
    { name: "Letrero «abierto» en ruinas", tag: "Promesa rota", element: "Fuego" },
    { name: "Huella dactilar en el humo", tag: "Prueba etérea", element: "Imaginario" },
    { name: "Ascensor express al sótano mental", tag: "Ingeniería onírica", element: "Neutral" },
  ];

  /** Habilidades equipables (tienda ◆, gacha habilidades). Máx. 4 por personaje; incluyen activas y pasivas. */
  const LOTG_BATTLE_SKILLS = [
    {
      id: "bs_coral_annih",
      name: "Lente tiene — aniquilación coralina",
      rarity: "SSS",
      desc: "Ola de daño cuántico contra toda la horda. En combate: 33 SP, enfriamiento 5 (por oleada enemiga).",
      shopSoul: 2150,
      combat: { kind: "dmg_mag_aoe", sp: 33, cd: 5, coef: 0.96 },
      element: "Neutral",
    },
    {
      id: "bs_fimbul",
      name: "Fimbulvetr — confesión helada",
      rarity: "SS",
      desc: "Hielo extremo sobre un enemigo; ~1,9× MA. 26 SP, CD 4.",
      shopSoul: 1560,
      combat: { kind: "dmg_mag_1", sp: 26, cd: 4, coef: 1.9 },
      element: "Hielo",
    },
    {
      id: "bs_blaze_trail",
      name: "Cicatriz ígnea — core Kafka",
      rarity: "SS",
      desc: "55% MA a todos y DoT ígneo (≈4,5% HP máx., 3 rondas enemigas). 27 SP, CD 4.",
      shopSoul: 1520,
      combat: { kind: "dot_aoe", sp: 27, cd: 4, coef: 0.55, dotTurns: 3, dotHpPct: 0.045 },
      element: "Fuego",
    },
    {
      id: "bs_sevens_bolt",
      name: "Recorte celeste — trueno errante",
      rarity: "S",
      desc: "Rayo focal; ~1,7× MA. 23 SP, CD 3.",
      shopSoul: 1070,
      combat: { kind: "dmg_mag_1", sp: 23, cd: 3, coef: 1.7 },
      element: "Trueno",
    },
    {
      id: "bs_jade_synergy",
      name: "Sinergia contable — mesa de Jade",
      rarity: "S",
      desc: "Refuerzo de equipo +10% daño durante 4 rondas enemigas. 21 SP, CD 5.",
      shopSoul: 985,
      combat: { kind: "buff_team", sp: 21, cd: 5, buffPct: 0.1, buffTurns: 4 },
    },
    {
      id: "bs_natasha_song",
      name: "Balada de sector 9",
      rarity: "S",
      desc: "Sanación en grupo (~18% HP máx.). 24 SP, CD 4.",
      shopSoul: 1005,
      combat: { kind: "heal_all", sp: 24, cd: 4, healPct: 0.18 },
    },
    {
      id: "bs_muelsyse_sap",
      name: "Savia Rhinelab — transmutación",
      rarity: "S",
      desc: "Golpe ~0,9× MA y DoT (≈4% HP máx., 3 rondas enemigas). 29 SP, CD 5.",
      shopSoul: 1150,
      combat: { kind: "dot_main", sp: 29, cd: 5, coef: 0.9, dotTurns: 3, dotHpPct: 0.04 },
      element: "Neutral",
    },
    {
      id: "bs_skull_crusher",
      name: "Marauder — cráneo estrella",
      rarity: "A",
      desc: "Daño físico brutal (~1,65× STG). 18 SP, CD 3.",
      shopSoul: 740,
      combat: { kind: "dmg_phys_1", sp: 18, cd: 3, coef: 1.65 },
    },
    {
      id: "bs_p5_eiga",
      name: "Eiga — sombra Neo-Feathermen",
      rarity: "A",
      desc: "Golpe mágico ~1,4× MA. 21 SP, CD 4.",
      shopSoul: 700,
      combat: { kind: "dmg_mag_1", sp: 21, cd: 4, coef: 1.42 },
      element: "Neutral",
    },
    {
      id: "bs_lushen_clear",
      name: "Lushen EX — despertar limpio",
      rarity: "A",
      desc: "Limpia estados en aliado o doctor. 16 SP, CD 3.",
      shopSoul: 635,
      combat: { kind: "cleanse_1", sp: 16, cd: 3 },
    },
    {
      id: "bs_tempest_wind",
      name: "Tornado imaginario",
      rarity: "A",
      desc: "Viento cortante a cada enemigo (~0,72× MA). 20 SP, CD 3.",
      shopSoul: 675,
      combat: { kind: "dmg_mag_aoe", sp: 20, cd: 3, coef: 0.72 },
      element: "Neutral",
    },
    {
      id: "bs_mika_chime",
      name: "Campanilla Mika — eco sagrado",
      rarity: "B",
      desc: "Cura intensiva a un objetivo (~22% HP máx.). 17 SP, CD 3.",
      shopSoul: 450,
      combat: { kind: "heal_1", sp: 17, cd: 3, healPct: 0.22 },
    },
    {
      id: "bs_trace_res",
      name: "Rastro de RES — guardián",
      rarity: "B",
      desc: "Pasiva: +4% HP máx. y ~2% mitigación. No gasta turno ni SP.",
      shopSoul: 535,
      combat: { kind: "passive", sp: 0, cd: 0 },
      passiveBonus: { hpPct: 0.04, defFlat: 0.02 },
    },
    {
      id: "bs_ether_wake",
      name: "Despertar de éter",
      rarity: "B",
      desc: "Pasiva: +6% daño mágico del portador.",
      shopSoul: 495,
      combat: { kind: "passive", sp: 0, cd: 0 },
      passiveBonus: { magDmgPct: 0.06 },
    },
    {
      id: "bs_yukari_snipe",
      name: "Full Moon — snipe dimensional",
      rarity: "A",
      desc: "Disparo preciso ~1,55× MA. 20 SP, CD 4.",
      shopSoul: 720,
      combat: { kind: "dmg_mag_1", sp: 20, cd: 4, coef: 1.55 },
      element: "Neutral",
    },
    {
      id: "bs_clamp_silence",
      name: "Clamp urbano — silencio administrativo",
      rarity: "A",
      desc: "Golpe + silencio en enemigo (3 rondas enemigas). 18 SP, CD 4.",
      shopSoul: 655,
      combat: { kind: "status_enemy_1", sp: 18, cd: 4, ailment: "silence", duration: 3, coef: 0.42 },
      element: "Neutral",
    },
    {
      id: "bs_hypnos_tick",
      name: "Latido Hipnos — sueño de contador",
      rarity: "A",
      desc: "Sueño 3 rondas enemigas en un enemigo. 21 SP, CD 4.",
      shopSoul: 690,
      combat: { kind: "status_enemy_1", sp: 21, cd: 4, ailment: "sleep", duration: 3, coef: 0.38 },
    },
    {
      id: "bs_static_snare",
      name: "Trampa estática — parálisis de cable",
      rarity: "S",
      desc: "Parálisis 3 rondas + daño. 23 SP, CD 4.",
      shopSoul: 965,
      combat: { kind: "status_enemy_1", sp: 23, cd: 4, ailment: "para", duration: 3, coef: 0.45 },
      element: "Trueno",
    },
    {
      id: "bs_rime_contract",
      name: "Contrato escarcha — congelación municipal",
      rarity: "S",
      desc: "Congelación 3 rondas enemigas. 24 SP, CD 4.",
      shopSoul: 995,
      combat: { kind: "status_enemy_1", sp: 24, cd: 4, ailment: "freeze", duration: 3, coef: 0.48 },
      element: "Hielo",
    },
    {
      id: "bs_cinder_mark",
      name: "Marca de ceniza — quemadura breve",
      rarity: "A",
      desc: "Quemadura 3 rondas + impacto ígneo. 20 SP, CD 4.",
      shopSoul: 675,
      combat: { kind: "status_enemy_1", sp: 20, cd: 4, ailment: "burn", duration: 3, coef: 0.44 },
      element: "Fuego",
    },
    {
      id: "bs_status_volley",
      name: "Salva de protocolos — área",
      rarity: "SS",
      desc: "Estados en horda (3 rondas) + daño mágico. 30 SP, CD 5.",
      shopSoul: 1475,
      combat: { kind: "status_enemy_aoe", sp: 30, cd: 5, coef: 0.35, duration: 3 },
      element: "Neutral",
    },
    {
      id: "bs_void_rewrite",
      name: "Reescritura del vacío — Nihility",
      rarity: "SSS",
      desc: "Ola masiva (~1,05× MA); vulnerabilidad implícita vía DoT en horda. 36 SP, CD 6.",
      shopSoul: 2680,
      combat: { kind: "dmg_mag_aoe", sp: 36, cd: 6, coef: 1.05 },
      element: "Neutral",
    },
    {
      id: "bs_binary_stars",
      name: "Binarias gemelas — dos hostiles",
      rarity: "SSS",
      desc: "Dos golpes físicos concentrados; ideal vs élite. 32 SP, CD 5.",
      shopSoul: 2550,
      combat: { kind: "phys_double_1", sp: 32, cd: 5, coef1: 1.02, coef2: 0.88 },
      element: "Neutral",
    },
    {
      id: "bs_glacial_probe",
      name: "Sonda glacial — res fría",
      rarity: "SS",
      desc: "Daño hielo + objetivo recibe +16% daño (3 rondas enemigas). 28 SP, CD 5.",
      shopSoul: 1680,
      combat: { kind: "debuff_vuln_1", sp: 28, cd: 5, coef: 0.62, vulnPct: 0.16, vulnTurns: 3 },
      element: "Hielo",
    },
    {
      id: "bs_ignite_probe",
      name: "Sonda ígnea — marca de cacería",
      rarity: "SS",
      desc: "Impacto ígneo + +14% daño recibido (3 r.). 27 SP, CD 5.",
      shopSoul: 1620,
      combat: { kind: "debuff_vuln_1", sp: 27, cd: 5, coef: 0.58, vulnPct: 0.14, vulnTurns: 3 },
      element: "Fuego",
    },
    {
      id: "bs_volt_chain_mark",
      name: "Cadena voltaica — marca de torre",
      rarity: "SS",
      desc: "Trueno focal + +15% daño (3 r.). 29 SP, CD 5.",
      shopSoul: 1700,
      combat: { kind: "debuff_vuln_1", sp: 29, cd: 5, coef: 0.6, vulnPct: 0.15, vulnTurns: 3 },
      element: "Trueno",
    },
    {
      id: "bs_entropy_tick",
      name: "Tictac entrópico — sangrado urbano",
      rarity: "SS",
      desc: "Daño + DoT por HP máx. (4 rondas enemigas). 31 SP, CD 5.",
      shopSoul: 1590,
      combat: { kind: "dot_main", sp: 31, cd: 5, coef: 0.72, dotTurns: 4, dotHpPct: 0.038 },
      element: "Neutral",
    },
    {
      id: "bs_winds_grace",
      name: "Gracia de viento — barrido Harmony",
      rarity: "S",
      desc: "+18% daño mágico propio (4 rondas enemigas). 19 SP, CD 4.",
      shopSoul: 920,
      combat: { kind: "buff_self_mod", sp: 19, cd: 4, physPct: 0, magPct: 0.18, modTurns: 4 },
    },
    {
      id: "bs_iron_stance",
      name: "Postura de hierro — Preservation",
      rarity: "S",
      desc: "+20% daño físico propio (4 r.). 18 SP, CD 4.",
      shopSoul: 905,
      combat: { kind: "buff_self_mod", sp: 18, cd: 4, physPct: 0.2, magPct: 0, modTurns: 4 },
    },
    {
      id: "bs_dual_edge",
      name: "Filo doble — callejón",
      rarity: "S",
      desc: "Dos cortes físicos; escala con STG. 24 SP, CD 4.",
      shopSoul: 980,
      combat: { kind: "phys_double_1", sp: 24, cd: 4, coef1: 0.88, coef2: 0.74 },
      element: "Neutral",
    },
    {
      id: "bs_plasma_lance",
      name: "Lanza plasma — ablation",
      rarity: "S",
      desc: "Daño mágico focal (~1,75× MA). 25 SP, CD 4.",
      shopSoul: 1010,
      combat: { kind: "dmg_mag_1", sp: 25, cd: 4, coef: 1.75 },
      element: "Trueno",
    },
    {
      id: "bs_cryo_spike",
      name: "Punta criogénica",
      rarity: "S",
      desc: "Congelación parcial vía daño hielo (~1,72× MA). 24 SP, CD 4.",
      shopSoul: 990,
      combat: { kind: "dmg_mag_1", sp: 24, cd: 4, coef: 1.72 },
      element: "Hielo",
    },
    {
      id: "bs_pyric_lance",
      name: "Lanza pírica — distrito rojo",
      rarity: "S",
      desc: "Ígneo focal (~1,78× MA). 25 SP, CD 4.",
      shopSoul: 1005,
      combat: { kind: "dmg_mag_1", sp: 25, cd: 4, coef: 1.78 },
      element: "Fuego",
    },
    {
      id: "bs_quake_breaker",
      name: "Rompetierra — demolición",
      rarity: "S",
      desc: "Golpe físico brutal (~1,82× STG). 22 SP, CD 4.",
      shopSoul: 975,
      combat: { kind: "dmg_phys_1", sp: 22, cd: 4, coef: 1.82 },
    },
    {
      id: "bs_starfall_volley",
      name: "Lluvia estelar — área",
      rarity: "S",
      desc: "Daño mágico a horda (~0,78× MA). 23 SP, CD 4.",
      shopSoul: 965,
      combat: { kind: "dmg_mag_aoe", sp: 23, cd: 4, coef: 0.78 },
      element: "Neutral",
    },
    {
      id: "bs_mending_wave",
      name: "Ola de sutura — abundancia",
      rarity: "A",
      desc: "Curación focal ~24% HP máx. 19 SP, CD 3.",
      shopSoul: 685,
      combat: { kind: "heal_1", sp: 19, cd: 3, healPct: 0.24 },
    },
    {
      id: "bs_overclock_slash",
      name: "Corte overclock",
      rarity: "A",
      desc: "Doble tajo físico medio. 21 SP, CD 3.",
      shopSoul: 695,
      combat: { kind: "phys_double_1", sp: 21, cd: 3, coef1: 0.72, coef2: 0.6 },
    },
    {
      id: "bs_resonant_mark",
      name: "Marca resonante — debilidad",
      rarity: "A",
      desc: "Daño + +11% recibido (3 r.). 20 SP, CD 4.",
      shopSoul: 710,
      combat: { kind: "debuff_vuln_1", sp: 20, cd: 4, coef: 0.48, vulnPct: 0.11, vulnTurns: 3 },
      element: "Neutral",
    },
    {
      id: "bs_gale_cutter",
      name: "Cortavientos — Imaginario",
      rarity: "A",
      desc: "Área cortante (~0,68× MA). 19 SP, CD 3.",
      shopSoul: 665,
      combat: { kind: "dmg_mag_aoe", sp: 19, cd: 3, coef: 0.68 },
      element: "Neutral",
    },
    {
      id: "bs_fang_rend",
      name: "Desgarro de colmillo",
      rarity: "A",
      desc: "Físico focal (~1,68× STG). 18 SP, CD 3.",
      shopSoul: 655,
      combat: { kind: "dmg_phys_1", sp: 18, cd: 3, coef: 1.68 },
    },
    {
      id: "bs_arc_needle",
      name: "Aguja de arco voltaico",
      rarity: "A",
      desc: "Mágico focal (~1,48× MA). 19 SP, CD 3.",
      shopSoul: 668,
      combat: { kind: "dmg_mag_1", sp: 19, cd: 3, coef: 1.48 },
      element: "Trueno",
    },
    {
      id: "bs_blood_price",
      name: "Precio en sangre — DoT",
      rarity: "A",
      desc: "Impacto + hemorragia mágica (3 r.). 22 SP, CD 4.",
      shopSoul: 720,
      combat: { kind: "dot_main", sp: 22, cd: 4, coef: 0.55, dotTurns: 3, dotHpPct: 0.035 },
      element: "Neutral",
    },
    {
      id: "bs_harmony_hum",
      name: "Tarareo armonioso",
      rarity: "A",
      desc: "+12% mág. y +8% fís. (3 r.). 17 SP, CD 4.",
      shopSoul: 640,
      combat: { kind: "buff_self_mod", sp: 17, cd: 4, physPct: 0.08, magPct: 0.12, modTurns: 3 },
    },
    {
      id: "bs_rime_slash",
      name: "Tajo escarchado",
      rarity: "B",
      desc: "Físico hielo (~1,38× STG). 15 SP, CD 2.",
      shopSoul: 455,
      combat: { kind: "dmg_phys_1", sp: 15, cd: 2, coef: 1.38 },
      element: "Hielo",
    },
    {
      id: "bs_spark_jab",
      name: "Golpe de chispa",
      rarity: "B",
      desc: "Físico trueno (~1,4× STG). 15 SP, CD 2.",
      shopSoul: 450,
      combat: { kind: "dmg_phys_1", sp: 15, cd: 2, coef: 1.4 },
      element: "Trueno",
    },
    {
      id: "bs_cinder_jab",
      name: "Punzón ígneo",
      rarity: "B",
      desc: "Físico fuego (~1,36× STG). 15 SP, CD 2.",
      shopSoul: 448,
      combat: { kind: "dmg_phys_1", sp: 15, cd: 2, coef: 1.36 },
      element: "Fuego",
    },
    {
      id: "bs_micro_burst",
      name: "Micro ráfaga cuántica",
      rarity: "B",
      desc: "Área leve (~0,52× MA). 14 SP, CD 2.",
      shopSoul: 430,
      combat: { kind: "dmg_mag_aoe", sp: 14, cd: 2, coef: 0.52 },
      element: "Neutral",
    },
    {
      id: "bs_first_aid_sig",
      name: "Firma de primeros auxilios",
      rarity: "B",
      desc: "Cura simple ~18% HP a un aliado o doctor. 14 SP, CD 2.",
      shopSoul: 425,
      combat: { kind: "heal_1", sp: 14, cd: 2, healPct: 0.18 },
    },
    {
      id: "bs_tactical_haze",
      name: "Bruma táctica",
      rarity: "B",
      desc: "+10% mág. (3 r.). 13 SP, CD 3.",
      shopSoul: 418,
      combat: { kind: "buff_self_mod", sp: 13, cd: 3, physPct: 0, magPct: 0.1, modTurns: 3 },
    },
    {
      id: "bs_grit_overlay",
      name: "Capa de determinación",
      rarity: "B",
      desc: "+12% fís. (3 r.). 13 SP, CD 3.",
      shopSoul: 415,
      combat: { kind: "buff_self_mod", sp: 13, cd: 3, physPct: 0.12, magPct: 0, modTurns: 3 },
    },
    {
      id: "bs_bleed_invoice",
      name: "Factura sangrante",
      rarity: "B",
      desc: "DoT focal (3 r.). 16 SP, CD 3.",
      shopSoul: 468,
      combat: { kind: "dot_main", sp: 16, cd: 3, coef: 0.35, dotTurns: 3, dotHpPct: 0.032 },
      element: "Neutral",
    },
    {
      id: "bs_soft_vuln",
      name: "Vulnerabilidad suave",
      rarity: "B",
      desc: "Daño + +9% recibido (2 r.). 15 SP, CD 3.",
      shopSoul: 440,
      combat: { kind: "debuff_vuln_1", sp: 15, cd: 3, coef: 0.38, vulnPct: 0.09, vulnTurns: 2 },
      element: "Neutral",
    },
    {
      id: "bs_twin_needle",
      name: "Doble aguja — combo corto",
      rarity: "B",
      desc: "Dos pinchos físicos ligeros. 16 SP, CD 3.",
      shopSoul: 462,
      combat: { kind: "phys_double_1", sp: 16, cd: 3, coef1: 0.58, coef2: 0.52 },
    },
    {
      id: "bs_passive_erudite",
      name: "Kernel erudito",
      rarity: "B",
      desc: "Pasiva: +7% daño mágico.",
      shopSoul: 510,
      combat: { kind: "passive", sp: 0, cd: 0 },
      passiveBonus: { magDmgPct: 0.07 },
    },
    {
      id: "bs_passive_hunt",
      name: "Instinto de cacería",
      rarity: "B",
      desc: "Pasiva: +7% daño físico.",
      shopSoul: 505,
      combat: { kind: "passive", sp: 0, cd: 0 },
      passiveBonus: { physDmgPct: 0.07 },
    },
    {
      id: "bs_passive_fort",
      name: "Muro de refracción",
      rarity: "B",
      desc: "Pasiva: +5% HP máx. y +3% mitigación.",
      shopSoul: 525,
      combat: { kind: "passive", sp: 0, cd: 0 },
      passiveBonus: { hpPct: 0.05, defFlat: 0.03 },
    },
    {
      id: "bs_passive_chain",
      name: "Sinapsis en cadena",
      rarity: "A",
      desc: "Pasiva: +5% mág. y +4% fís.",
      shopSoul: 620,
      combat: { kind: "passive", sp: 0, cd: 0 },
      passiveBonus: { magDmgPct: 0.05, physDmgPct: 0.04 },
    },
    {
      id: "bs_imaginary_lance",
      name: "Lanza de tercer plano",
      rarity: "A",
      desc: "Daño Imaginario focal (~1,52× MA). 20 SP, CD 3.",
      shopSoul: 678,
      combat: { kind: "dmg_mag_1", sp: 20, cd: 3, coef: 1.52 },
      element: "Neutral",
    },
    {
      id: "bs_blizzard_lane",
      name: "Carril ventisca — área",
      rarity: "S",
      desc: "Ventisca a horda (~0,62× MA). 26 SP, CD 4.",
      shopSoul: 1020,
      combat: { kind: "dmg_mag_aoe", sp: 26, cd: 4, coef: 0.62 },
      element: "Hielo",
    },
    {
      id: "bs_inferno_lane",
      name: "Carril infernal — área",
      rarity: "S",
      desc: "Ola ígnea (~0,64× MA). 26 SP, CD 4.",
      shopSoul: 1035,
      combat: { kind: "dmg_mag_aoe", sp: 26, cd: 4, coef: 0.64 },
      element: "Fuego",
    },
    {
      id: "bs_bunker_breaker",
      name: "Rompibúnker — impacto pesado",
      rarity: "S",
      desc: "Físico severo (~1,95× STG). 26 SP, CD 4.",
      shopSoul: 1080,
      combat: { kind: "dmg_phys_1", sp: 26, cd: 4, coef: 1.95 },
    },
    {
      id: "bs_two_stage_press",
      name: "Prensa de dos etapas",
      rarity: "S",
      desc: "Combo físico de 2 golpes fuertes. 24 SP, CD 4.",
      shopSoul: 1020,
      combat: { kind: "phys_double_1", sp: 24, cd: 4, coef1: 0.96, coef2: 0.86 },
    },
    {
      id: "bs_rifle_pulse",
      name: "Pulso de rifle — línea roja",
      rarity: "S",
      desc: "Disparo táctico (escala DX + arma). 25 SP, CD 4.",
      shopSoul: 1045,
      combat: { kind: "dmg_firearm_1", sp: 25, cd: 4, coef: 1.62 },
      element: "Neutral",
    },
    {
      id: "bs_sniper_clock",
      name: "Reloj de francotirador",
      rarity: "SS",
      desc: "Disparo crítico de precisión (DX). 30 SP, CD 5.",
      shopSoul: 1760,
      combat: { kind: "dmg_firearm_1", sp: 30, cd: 5, coef: 1.92 },
      element: "Trueno",
    },
    {
      id: "bs_bullet_chain",
      name: "Cadena balística",
      rarity: "A",
      desc: "Disparo rápido a un objetivo (DX). 18 SP, CD 3.",
      shopSoul: 735,
      combat: { kind: "dmg_firearm_1", sp: 18, cd: 3, coef: 1.38 },
      element: "Neutral",
    },
    {
      id: "bs_rotary_breach",
      name: "Brecha rotatoria",
      rarity: "SS",
      desc: "Físico demoledor + vulnerabilidad 16% (3 r.). 29 SP, CD 5.",
      shopSoul: 1720,
      combat: { kind: "debuff_vuln_1", sp: 29, cd: 5, coef: 0.66, vulnPct: 0.16, vulnTurns: 3 },
      element: "Neutral",
    },
    {
      id: "bs_bayonet_cross",
      name: "Cruz de bayoneta",
      rarity: "A",
      desc: "Dos tajos + disparo corto (híbrido físico). 19 SP, CD 3.",
      shopSoul: 760,
      combat: { kind: "phys_double_1", sp: 19, cd: 3, coef1: 0.7, coef2: 0.66 },
      element: "Neutral",
    },
    {
      id: "bs_locomotive_kick",
      name: "Patada locomotora",
      rarity: "A",
      desc: "Golpe físico puro (~1,72× STG). 18 SP, CD 3.",
      shopSoul: 705,
      combat: { kind: "dmg_phys_1", sp: 18, cd: 3, coef: 1.72 },
    },
    {
      id: "bs_afterburn_shot",
      name: "Tiro de postcombustión",
      rarity: "A",
      desc: "Disparo ígneo con DX alto. 20 SP, CD 3.",
      shopSoul: 790,
      combat: { kind: "dmg_firearm_1", sp: 20, cd: 3, coef: 1.5 },
      element: "Fuego",
    },
    {
      id: "bs_hollow_walker",
      name: "Marcha del hollow walker",
      rarity: "B",
      desc: "Disparo simple de arma de fuego (DX). 14 SP, CD 2.",
      shopSoul: 470,
      combat: { kind: "dmg_firearm_1", sp: 14, cd: 2, coef: 1.2 },
      element: "Neutral",
    },
    {
      id: "bs_boxing_frame",
      name: "Frame de boxeo",
      rarity: "B",
      desc: "Gancho físico rápido (~1,34× STG). 13 SP, CD 2.",
      shopSoul: 455,
      combat: { kind: "dmg_phys_1", sp: 13, cd: 2, coef: 1.34 },
    },
    {
      id: "bs_en_fracture",
      name: "Fractura de blindaje EN",
      rarity: "S",
      desc: "Daño + reduce EN del objetivo (3 rondas enemigas). 24 SP, CD 4.",
      shopSoul: 1080,
      combat: { kind: "debuff_en_1", sp: 24, cd: 4, coef: 0.62, enDown: 22, enTurns: 3 },
      element: "Neutral",
    },
    {
      id: "bs_en_collapse_field",
      name: "Campo de colapso dieléctrico",
      rarity: "SS",
      desc: "Debuff EN en horda completa (2 rondas). 31 SP, CD 5.",
      shopSoul: 1725,
      combat: { kind: "debuff_en_aoe", sp: 31, cd: 5, coef: 0.36, enDown: 14, enTurns: 2 },
      element: "Trueno",
    },
    {
      id: "bs_armor_melt_script",
      name: "Script de armadura derretida",
      rarity: "A",
      desc: "Impacto ígneo + EN -16 (3 rondas). 20 SP, CD 3.",
      shopSoul: 745,
      combat: { kind: "debuff_en_1", sp: 20, cd: 3, coef: 0.5, enDown: 16, enTurns: 3 },
      element: "Fuego",
    },
    {
      id: "bs_guardian_protocol",
      name: "Protocolo de guardia total",
      rarity: "S",
      desc: "Equipo recibe -20% daño por 3 rondas enemigas. 22 SP, CD 5.",
      shopSoul: 1120,
      combat: { kind: "buff_team_guard", sp: 22, cd: 5, guardPct: 0.2, guardTurns: 3 },
    },
    {
      id: "bs_fog_of_weakness",
      name: "Niebla de debilidad hostil",
      rarity: "A",
      desc: "Objetivo hace -22% daño (3 rondas). 19 SP, CD 4.",
      shopSoul: 780,
      combat: { kind: "debuff_enemy_damage_1", sp: 19, cd: 4, coef: 0.42, atkDownPct: 0.22, atkDownTurns: 3 },
      element: "Neutral",
    },
    {
      id: "bs_safety_lattice",
      name: "Celosía de seguridad",
      rarity: "SS",
      desc: "Horda enemiga hace -16% daño (2 rondas). 30 SP, CD 5.",
      shopSoul: 1660,
      combat: { kind: "debuff_enemy_damage_aoe", sp: 30, cd: 5, atkDownPct: 0.16, atkDownTurns: 2 },
      element: "Neutral",
    },
    {
      id: "bs_plasma_burst_dx",
      name: "Ráfaga plasma DX",
      rarity: "S",
      desc: "Disparo de alta destreza (~1,72 DX). 24 SP, CD 4.",
      shopSoul: 1070,
      combat: { kind: "dmg_firearm_1", sp: 24, cd: 4, coef: 1.72 },
      element: "Trueno",
    },
    {
      id: "bs_shell_break_impact",
      name: "Impacto rompecasco",
      rarity: "S",
      desc: "Físico fuerte + vulnerable 12% (3 r.). 23 SP, CD 4.",
      shopSoul: 1035,
      combat: { kind: "debuff_vuln_1", sp: 23, cd: 4, coef: 0.6, vulnPct: 0.12, vulnTurns: 3 },
      element: "Neutral",
    },
    {
      id: "bs_ion_shear",
      name: "Cizalla iónica",
      rarity: "A",
      desc: "Daño mágico rápido y consistente. 18 SP, CD 3.",
      shopSoul: 720,
      combat: { kind: "dmg_mag_1", sp: 18, cd: 3, coef: 1.6 },
      element: "Trueno",
    },
    {
      id: "bs_bulwark_harmony",
      name: "Harmonía de baluarte",
      rarity: "A",
      desc: "Equipo recibe -14% daño por 2 rondas enemigas. 17 SP, CD 4.",
      shopSoul: 690,
      combat: { kind: "buff_team_guard", sp: 17, cd: 4, guardPct: 0.14, guardTurns: 2 },
    },
    {
      id: "bs_morale_crash",
      name: "Caída de moral enemiga",
      rarity: "S",
      desc: "Debuff de daño al enemigo objetivo. 22 SP, CD 4.",
      shopSoul: 1010,
      combat: { kind: "debuff_enemy_damage_1", sp: 22, cd: 4, coef: 0.45, atkDownPct: 0.26, atkDownTurns: 3 },
      element: "Neutral",
    },
    {
      id: "bs_heavy_slug",
      name: "Slug pesado de precisión",
      rarity: "A",
      desc: "Disparo físico por DX/arma. 19 SP, CD 3.",
      shopSoul: 755,
      combat: { kind: "dmg_firearm_1", sp: 19, cd: 3, coef: 1.46 },
      element: "Neutral",
    },
    {
      id: "bs_twin_slug",
      name: "Doble slug perforante",
      rarity: "S",
      desc: "Combo de proyectiles pesados. 23 SP, CD 4.",
      shopSoul: 1045,
      combat: { kind: "phys_double_1", sp: 23, cd: 4, coef1: 0.94, coef2: 0.82 },
      element: "Neutral",
    },
    {
      id: "bs_witch_bolt",
      name: "Perno de bruja urbana",
      rarity: "A",
      desc: "Mágico alto y limpio. 19 SP, CD 3.",
      shopSoul: 735,
      combat: { kind: "dmg_mag_1", sp: 19, cd: 3, coef: 1.62 },
      element: "Neutral",
    },
    {
      id: "bs_frost_torque",
      name: "Par motor escarchado",
      rarity: "A",
      desc: "Físico hielo con buena penetración. 18 SP, CD 3.",
      shopSoul: 710,
      combat: { kind: "dmg_phys_1", sp: 18, cd: 3, coef: 1.76 },
      element: "Hielo",
    },
    {
      id: "bs_blackout_code",
      name: "Código de apagón",
      rarity: "SS",
      desc: "Horda hace -18% daño (2 rondas). 28 SP, CD 5.",
      shopSoul: 1600,
      combat: { kind: "debuff_enemy_damage_aoe", sp: 28, cd: 5, atkDownPct: 0.18, atkDownTurns: 2 },
      element: "Neutral",
    },
    {
      id: "bs_passive_en_hunter",
      name: "Pasiva: Cazador de blindajes",
      rarity: "A",
      desc: "Pasiva: +9% daño físico del portador.",
      shopSoul: 760,
      combat: { kind: "passive", sp: 0, cd: 0 },
      passiveBonus: { physDmgPct: 0.09 },
    },
    {
      id: "bs_passive_guardmind",
      name: "Pasiva: Mente de centinela",
      rarity: "A",
      desc: "Pasiva: +6% HP máx. y +4% mitigación.",
      shopSoul: 790,
      combat: { kind: "passive", sp: 0, cd: 0 },
      passiveBonus: { hpPct: 0.06, defFlat: 0.04 },
    },
    {
      id: "bs_passive_ballistician",
      name: "Pasiva: Balística avanzada",
      rarity: "S",
      desc: "Pasiva: +7% físico y +5% mágico.",
      shopSoul: 1060,
      combat: { kind: "passive", sp: 0, cd: 0 },
      passiveBonus: { physDmgPct: 0.07, magDmgPct: 0.05 },
    },
    {
      id: "bs_passive_vital_plate",
      name: "Pasiva: Placa vital",
      rarity: "B",
      desc: "Pasiva: +7% HP máx.",
      shopSoul: 530,
      combat: { kind: "passive", sp: 0, cd: 0 },
      passiveBonus: { hpPct: 0.07 },
    },
    {
      id: "bs_passive_focus_frame",
      name: "Pasiva: Marco de enfoque",
      rarity: "B",
      desc: "Pasiva: +8% daño mágico.",
      shopSoul: 545,
      combat: { kind: "passive", sp: 0, cd: 0 },
      passiveBonus: { magDmgPct: 0.08 },
    },
    {
      id: "bs_passive_arcane_core",
      name: "Pasiva: Núcleo arcano",
      rarity: "S",
      desc: "Pasiva: +12% daño mágico.",
      shopSoul: 1120,
      combat: { kind: "passive", sp: 0, cd: 0 },
      passiveBonus: { magDmgPct: 0.12 },
    },
    {
      id: "bs_passive_aggro_drive",
      name: "Pasiva: Impulso agresivo",
      rarity: "A",
      desc: "Pasiva: +10% daño físico.",
      shopSoul: 815,
      combat: { kind: "passive", sp: 0, cd: 0 },
      passiveBonus: { physDmgPct: 0.1 },
    },
    {
      id: "bs_passive_mana_loop",
      name: "Pasiva: Bucle de maná",
      rarity: "B",
      desc: "Pasiva: +5% HP y +5% daño mágico.",
      shopSoul: 560,
      combat: { kind: "passive", sp: 0, cd: 0 },
      passiveBonus: { hpPct: 0.05, magDmgPct: 0.05 },
    },
    {
      id: "bs_passive_critical_eye",
      name: "Pasiva: Ojo crítico",
      rarity: "S",
      desc: "Pasiva: +8% físico y +6% mágico.",
      shopSoul: 1090,
      combat: { kind: "passive", sp: 0, cd: 0 },
      passiveBonus: { physDmgPct: 0.08, magDmgPct: 0.06 },
    },
    {
      id: "bs_passive_tri_force",
      name: "Pasiva: Trifuerza clínica",
      rarity: "SS",
      desc: "Pasiva: +10% HP, +8% físico y +8% mágico.",
      shopSoul: 1750,
      combat: { kind: "passive", sp: 0, cd: 0 },
      passiveBonus: { hpPct: 0.1, physDmgPct: 0.08, magDmgPct: 0.08 },
    },
    {
      id: "bs_sunder_pulse_aoe",
      name: "Pulso desgarrador en área",
      rarity: "SS",
      desc: "Daño mágico en horda + EN -12 (2 r.). 29 SP, CD 5.",
      shopSoul: 1655,
      combat: { kind: "debuff_en_aoe", sp: 29, cd: 5, coef: 0.38, enDown: 12, enTurns: 2 },
      element: "Neutral",
    },
    {
      id: "bs_exposed_nerves",
      name: "Nervios expuestos",
      rarity: "A",
      desc: "Vulnerable +16% al objetivo (3 r.). 20 SP, CD 4.",
      shopSoul: 770,
      combat: { kind: "debuff_vuln_1", sp: 20, cd: 4, coef: 0.46, vulnPct: 0.16, vulnTurns: 3 },
      element: "Neutral",
    },
    {
      id: "bs_team_cover_wall",
      name: "Muro de cobertura en equipo",
      rarity: "SS",
      desc: "Equipo recibe -26% daño (2 r.). 30 SP, CD 6.",
      shopSoul: 1710,
      combat: { kind: "buff_team_guard", sp: 30, cd: 6, guardPct: 0.26, guardTurns: 2 },
    },
    {
      id: "bs_soul_laceration",
      name: "Laceración anímica",
      rarity: "S",
      desc: "DoT fuerte + EN -14 (3 r.). 26 SP, CD 5.",
      shopSoul: 1140,
      combat: { kind: "debuff_en_1", sp: 26, cd: 5, coef: 0.54, enDown: 14, enTurns: 3 },
      element: "Neutral",
    },
    {
      id: "bs_hardpoint_barrage",
      name: "Barrera hardpoint — ráfaga",
      rarity: "S",
      desc: "Disparo especializado de DX/arma. 24 SP, CD 4.",
      shopSoul: 1095,
      combat: { kind: "dmg_firearm_1", sp: 24, cd: 4, coef: 1.74 },
      element: "Neutral",
    },
    {
      id: "bs_guard_break_delta",
      name: "Delta rompeguardia",
      rarity: "A",
      desc: "EN -18 y daño limpio al objetivo. 21 SP, CD 4.",
      shopSoul: 805,
      combat: { kind: "debuff_en_1", sp: 21, cd: 4, coef: 0.52, enDown: 18, enTurns: 3 },
      element: "Neutral",
    },
    {
      id: "bs_suppressive_flash",
      name: "Destello supresor",
      rarity: "A",
      desc: "Objetivo hace -18% daño (3 r.). 18 SP, CD 3.",
      shopSoul: 735,
      combat: { kind: "debuff_enemy_damage_1", sp: 18, cd: 3, coef: 0.4, atkDownPct: 0.18, atkDownTurns: 3 },
      element: "Neutral",
    },
    {
      id: "bs_mag_overclock",
      name: "Overclock arcano",
      rarity: "S",
      desc: "+24% daño mágico propio (4 r. enemigas). 22 SP, CD 4.",
      shopSoul: 1115,
      combat: { kind: "buff_self_mod", sp: 22, cd: 4, physPct: 0, magPct: 0.24, modTurns: 4 },
    },
    {
      id: "bs_phys_overclock",
      name: "Overclock de asalto",
      rarity: "S",
      desc: "+24% daño físico propio (4 r. enemigas). 22 SP, CD 4.",
      shopSoul: 1115,
      combat: { kind: "buff_self_mod", sp: 22, cd: 4, physPct: 0.24, magPct: 0, modTurns: 4 },
    },
  ];

  function getLotgBattleSkill(id) {
    if (!id) return null;
    return LOTG_BATTLE_SKILLS.find((x) => x && x.id === id) || null;
  }

  /** Precio Soul de tienda con recargo fuerte en S/SS/SSS e inflación leve por compras en la run. */
  function lotgSkillShopPrice(sk) {
    if (!sk) return 99999;
    const base = sk.shopSoul != null ? sk.shopSoul : 480;
    const tier =
      sk.rarity === "SSS" ? 3.1 : sk.rarity === "SS" ? 2.45 : sk.rarity === "S" ? 2.05 : sk.rarity === "A" ? 1.55 : sk.rarity === "B" ? 1.32 : 1.12;
    const purchases = (lotgState && Number(lotgState.shopSoulPurchases)) || 0;
    const inflation = 1 + Math.min(2.5, purchases * 0.038);
    return Math.max(200, Math.floor(base * tier * inflation));
  }

  /** Quién tiene equipada la técnica (solo una unidad a la vez). */
  function lotgSkillGlobalOwner(state, skillId) {
    if (!state || !skillId) return null;
    if ((state.equippedSkillsProtag || []).includes(skillId)) return "protag";
    const u = (state.roster || []).find((x) => (x.equippedSkills || []).includes(skillId));
    return u ? u.uid : null;
  }

  /** Prioridad: doctor, luego reclutas en orden; una misma técnica no puede repetirse. */
  function lotgMigrateExclusiveSkills(s) {
    if (!s) return;
    const claimed = new Map();
    const pro = (s.equippedSkillsProtag || []).filter((id) => typeof id === "string").slice(0, 4);
    const proN = [];
    pro.forEach((id) => {
      if (!claimed.has(id)) {
        claimed.set(id, "protag");
        proN.push(id);
      }
    });
    s.equippedSkillsProtag = proN;
    (s.roster || []).forEach((u) => {
      const raw = (u.equippedSkills || []).filter((id) => typeof id === "string").slice(0, 4);
      const fin = [];
      raw.forEach((id) => {
        if (!claimed.has(id)) {
          claimed.set(id, u.uid);
          fin.push(id);
        }
      });
      u.equippedSkills = fin;
    });
  }

  function lotgAbilityGachaPool() {
    return LOTG_BATTLE_SKILLS.filter((x) => x && ["A", "S", "SS", "SSS"].includes(x.rarity));
  }

  function pickRandomAbilityFromGacha() {
    const pool = lotgAbilityGachaPool();
    if (!pool.length) return null;
    const r = Math.random() * 100;
    let tier;
    if (r < 0.35) tier = "SSS";
    else if (r < 2.2) tier = "SS";
    else if (r < 12) tier = "S";
    else tier = "A";
    const sub = pool.filter((x) => x.rarity === tier);
    const pickFrom = sub.length ? sub : pool;
    return pickFrom[Math.floor(Math.random() * pickFrom.length)];
  }

  function sumLotgEquippedPassivesForUnit(u) {
    const b = { hpPct: 0, magDmgPct: 0, physDmgPct: 0, defFlat: 0 };
    const ids = (u ? u.equippedSkills : null) || [];
    ids.slice(0, 4).forEach((id) => {
      const sk = getLotgBattleSkill(id);
      if (sk && sk.combat && sk.combat.kind === "passive" && sk.passiveBonus) {
        b.hpPct += sk.passiveBonus.hpPct || 0;
        b.magDmgPct += sk.passiveBonus.magDmgPct || 0;
        b.physDmgPct += sk.passiveBonus.physDmgPct || 0;
        b.defFlat += sk.passiveBonus.defFlat || 0;
      }
    });
    return b;
  }

  function sumLotgEquippedPassivesProtag() {
    const b = { hpPct: 0, magDmgPct: 0, physDmgPct: 0, defFlat: 0 };
    const ids = (lotgState && lotgState.equippedSkillsProtag) || [];
    ids.slice(0, 4).forEach((id) => {
      const sk = getLotgBattleSkill(id);
      if (sk && sk.combat && sk.combat.kind === "passive" && sk.passiveBonus) {
        b.hpPct += sk.passiveBonus.hpPct || 0;
        b.magDmgPct += sk.passiveBonus.magDmgPct || 0;
        b.physDmgPct += sk.passiveBonus.physDmgPct || 0;
        b.defFlat += sk.passiveBonus.defFlat || 0;
      }
    });
    return b;
  }

  let filterSlot = "all";
  let lotgState = null;
  /** Enemigos en combate actual (horda); vacío = fuera de combate. */
  let combatEnemies = [];

  function inLotgCombat() {
    return combatEnemies.length > 0 && combatEnemies.some((e) => e && e.hp > 0);
  }

  function firstAliveEnemy() {
    return combatEnemies.find((e) => e && e.hp > 0) || null;
  }

  function anyEnemyAlive() {
    return combatEnemies.some((e) => e && e.hp > 0);
  }

  const LOTG_AILMENT_KEYS = ["silence", "sleep", "burn", "freeze", "para"];
  const LOTG_AILMENT_LABELS = {
    silence: "Silencio",
    sleep: "Sueño",
    burn: "Quemadura",
    freeze: "Congelación",
    para: "Parálisis",
  };
  const LOTG_ENEMY_STATUS_BY_ELEMENT = {
    Fuego: ["burn", "burn", "silence", "para"],
    Hielo: ["freeze", "freeze", "sleep", "silence"],
    Trueno: ["para", "para", "silence", "burn"],
    Neutral: ["silence", "sleep", "para", "freeze", "burn"],
    Imaginario: ["sleep", "silence", "para"],
  };

  function emptyAilments() {
    return { silence: 0, sleep: 0, burn: 0, freeze: 0, para: 0 };
  }

  function mergeAilments(obj) {
    const z = emptyAilments();
    if (!obj || typeof obj !== "object") return z;
    LOTG_AILMENT_KEYS.forEach((k) => {
      const n = Math.max(0, Math.floor(Number(obj[k]) || 0));
      z[k] = n;
    });
    return z;
  }

  function ensureEnemyAilments(en) {
    if (!en) return emptyAilments();
    en.ailments = mergeAilments(en.ailments);
    return en.ailments;
  }

  function applyAilmentToTargetParty(tk, key, turns) {
    if (!lotgState) return;
    const t = Math.max(1, Math.min(9, turns || 3));
    const k = key && LOTG_AILMENT_KEYS.includes(key) ? key : "burn";
    if (tk === "protag") {
      lotgState.protagAilments = mergeAilments(lotgState.protagAilments);
      lotgState.protagAilments[k] = Math.max(lotgState.protagAilments[k] || 0, t);
      return;
    }
    const v = lotgState.combatAllyVitals && lotgState.combatAllyVitals[tk];
    if (!v) return;
    v.ailments = mergeAilments(v.ailments);
    v.ailments[k] = Math.max(v.ailments[k] || 0, t);
  }

  function applyAilmentToEnemy(en, key, turns) {
    if (!en || en.hp <= 0) return;
    const a = ensureEnemyAilments(en);
    const k = key && LOTG_AILMENT_KEYS.includes(key) ? key : "silence";
    const t = Math.max(1, Math.min(9, turns || 3));
    a[k] = Math.max(a[k] || 0, t);
  }

  function allyFreezeDamageMult(vitals) {
    if (!vitals || !vitals.ailments) return 1;
    return (vitals.ailments.freeze || 0) > 0 ? 0.78 : 1;
  }

  function protagFreezeDamageMult() {
    const a = lotgState && lotgState.protagAilments ? mergeAilments(lotgState.protagAilments) : emptyAilments();
    return a.freeze > 0 ? 0.78 : 1;
  }

  function formatAilmentsShort(a) {
    const z = mergeAilments(a);
    const parts = LOTG_AILMENT_KEYS.filter((k) => z[k] > 0).map((k) => LOTG_AILMENT_LABELS[k] + " ×" + z[k]);
    return parts.length ? parts.join(" · ") : "";
  }

  function lotgPartyBurnTick(logLine) {
    if (!lotgState || !inLotgCombat()) return;
    const p = lotgState.protag;
    const cs = applyEquipToProtag();
    const pa = mergeAilments(lotgState.protagAilments);
    if (pa.burn > 0 && p.hpCur > 0) {
      const d = Math.max(1, Math.floor(cs.hpMax * 0.038));
      p.hpCur = Math.max(0, p.hpCur - d);
      logLine("Quemadura → " + p.name + ": −" + d + ".");
    }
    getPartyUnits().forEach((u) => {
      const v = lotgState.combatAllyVitals && lotgState.combatAllyVitals[u.uid];
      if (!v || v.hp <= 0) return;
      const ax = mergeAilments(v.ailments);
      if (ax.burn > 0) {
        const am = allyCombatStats(u);
        const d = Math.max(1, Math.floor(am.hpMax * 0.038));
        v.hp = Math.max(0, v.hp - d);
        logLine("Quemadura → " + u.name + ": −" + d + ".");
      }
    });
    combatEnemies.forEach((en) => {
      if (!en || en.hp <= 0) return;
      const ax = mergeAilments(en.ailments);
      if (ax.burn > 0) {
        const d = Math.max(1, Math.floor(en.hpMax * 0.034));
        en.hp -= d;
        logLine("Quemadura → " + en.name + ": −" + d + ".");
      }
    });
  }

  function lotgDecrementAllAilmentTurns() {
    if (!lotgState) return;
    const dec = (obj) => {
      if (!obj) return;
      LOTG_AILMENT_KEYS.forEach((k) => {
        if ((obj[k] || 0) > 0) obj[k] = (obj[k] || 0) - 1;
      });
    };
    if (lotgState.protagAilments) dec(lotgState.protagAilments);
    getPartyUnits().forEach((u) => {
      const v = lotgState.combatAllyVitals && lotgState.combatAllyVitals[u.uid];
      if (v && v.ailments) dec(v.ailments);
    });
    combatEnemies.forEach((en) => {
      if (en && en.ailments) dec(en.ailments);
    });
  }

  function pickEnemyStatusAilment(en) {
    const el = en.element || "Neutral";
    const pool = LOTG_ENEMY_STATUS_BY_ELEMENT[el] || LOTG_ENEMY_STATUS_BY_ELEMENT.Neutral;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function protagBlockedBySleepPara(action) {
    const pa = mergeAilments(lotgState && lotgState.protagAilments);
    if (action === "flee") return null;
    if ((pa.sleep || 0) > 0) {
      return "Sueño: no podés atacar ni usar técnicas del doctor; los objetos siguen disponibles o podés huir.";
    }
    const heavy = action === "atk" || action === "skill" || (typeof action === "string" && action.indexOf("lotgextra:") === 0);
    if (!heavy) return null;
    if ((pa.para || 0) > 0 && Math.random() < 0.36) return "¡Parálisis! El cuerpo no responde y el turno pasa a los aliados.";
    return null;
  }

  function allyBlockedByPara(vitals, kind) {
    if (kind === "pass") return null;
    const ax = mergeAilments(vitals && vitals.ailments);
    if ((ax.para || 0) > 0 && Math.random() < 0.36) return "Parálisis: no actúa a tiempo.";
    return null;
  }

  function normalizeLotgElement(el) {
    const s = String(el || "");
    if (/fuego|ígneo|igneo/i.test(s)) return "Fuego";
    if (/hielo|escarcha|ice/i.test(s)) return "Hielo";
    if (/trueno|rayo|electro|thunder/i.test(s)) return "Trueno";
    return "Neutral";
  }

  function elementalDamageMult(attackerEl, defenderEl) {
    const a = normalizeLotgElement(String(attackerEl || ""));
    const d = normalizeLotgElement(String(defenderEl || ""));
    if (a === "Neutral" || d === "Neutral") return 1;
    if (LOTG_TRIANGLE[a] === d) return 1.22;
    if (LOTG_TRIANGLE[d] === a) return 0.82;
    return 1;
  }

  function formatEquipBonusLine(eq) {
    if (!eq || !eq.bonus || typeof eq.bonus !== "object") return "";
    const parts = STAT_KEYS.map((k) => {
      const v = eq.bonus[k];
      if (v == null || v === 0) return null;
      return k + " +" + v;
    }).filter(Boolean);
    if (eq.specialAffix && eq.specialAffix.label) parts.push(eq.specialAffix.label);
    return parts.length ? parts.join(" · ") : "";
  }

  function lotgAccessoryAffixFromSlots(slots) {
    if (!slots || !slots.Accesorio) return null;
    const ac = slots.Accesorio;
    return ac && ac.specialAffix ? ac.specialAffix : null;
  }

  /** Bonos económicos por accesorios de doctor + aliados activos en party. */
  function lotgEconomyBonusFromAccessories() {
    if (!lotgState) return { soulPct: 0, zenPct: 0, xpPct: 0 };
    let soulPct = 0;
    let zenPct = 0;
    let xpPct = 0;
    const consume = (aff) => {
      if (!aff || !aff.type) return;
      if (aff.type === "soul_gain") soulPct += Number(aff.pct) || 0;
      else if (aff.type === "zen_gain") zenPct += Number(aff.pct) || 0;
      else if (aff.type === "xp_gain") xpPct += Number(aff.pct) || 0;
    };
    consume(lotgAccessoryAffixFromSlots(lotgState.equipSlots || {}));
    getPartyUnits().forEach((u) => consume(lotgAccessoryAffixFromSlots(u.equipSlots || {})));
    return {
      soulPct: Math.min(0.65, soulPct),
      zenPct: Math.min(0.65, zenPct),
      xpPct: Math.min(0.55, xpPct),
    };
  }

  /** Sinergia de accesorios: daño extra si alcanzas umbral de stat. */
  function lotgAccessorySynergyPct(slots, mergedStats, wantedScope) {
    const aff = lotgAccessoryAffixFromSlots(slots);
    if (!aff || aff.type !== "stat_synergy") return 0;
    if (aff.scope && aff.scope !== "all" && aff.scope !== wantedScope) return 0;
    const st = String(aff.stat || "");
    const th = Number(aff.threshold) || 9999;
    const val = mergedStats && Number(mergedStats[st]);
    if (!Number.isFinite(val) || val < th) return 0;
    return Math.max(0, Number(aff.pct) || 0);
  }

  function getWeaponDamageStatBonusFromSlots(slots, key) {
    if (!slots || !slots.Arma) return 0;
    const w = slots.Arma;
    const b = w && w.bonus ? w.bonus : {};
    const fp = w && w.forgePlus != null ? Math.min(10, Math.max(0, Math.floor(Number(w.forgePlus) || 0))) : 0;
    const base = Number(b[key]) || 0;
    const forgeBoost = base * fp * 0.11;
    return base + forgeBoost;
  }
  let combatLog = [];
  let skillCdPro = 0;
  let combatPhase = "player";
  let combatAllyIndex = 0;
  let vnQueue = [];
  /** Modo selección de objetivo en combate: { type, uid?, profile? } */
  let combatPickMode = null;

  /** Limpia combate en curso y la UI de batalla (evita quedar “atascado” en la pelea tras derrota o al reiniciar). */
  function clearCombatScene() {
    combatEnemies = [];
    combatLog = [];
    skillCdPro = 0;
    combatPhase = "player";
    combatAllyIndex = 0;
    combatPickMode = null;
    if (lotgState && lotgState.combatAllyVitals) delete lotgState.combatAllyVitals;
    if (lotgState && lotgState.combatBuff) lotgState.combatBuff = { atkMult: 1, turns: 0 };
    const wrap = document.getElementById("lotgGameWrap");
    if (wrap) {
      wrap.style.backgroundImage = "";
      if (wrap.dataset) delete wrap.dataset.cbg;
    }
  }

  /** Asegura que Soul Points sea un entero válido (JSON/localStorage a veces deja null, string o NaN). */
  function normalizeSoulPointsOnState(s) {
    if (!s) return;
    let raw = s.soul;
    if (raw === undefined || raw === null) {
      if (s.soulPoints != null) raw = s.soulPoints;
    }
    const n = typeof raw === "string" && raw.trim() !== "" ? parseInt(raw, 10) : Number(raw);
    if (!Number.isFinite(n) || Number.isNaN(n)) {
      s.soul = INITIAL_SOUL;
      return;
    }
    s.soul = Math.max(0, Math.floor(n));
  }

  function getSoulPoints() {
    if (!lotgState) return 0;
    normalizeSoulPointsOnState(lotgState);
    return lotgState.soul;
  }

  function pickCommonBannerFour() {
    const pool = GACHA_UNITS.filter((u) => !u.promo).map((u) => ({ img: u.img, name: u.name }));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = pool[i];
      pool[i] = pool[j];
      pool[j] = t;
    }
    return pool.slice(0, 4);
  }

  function commonPoolRecruitNamesHtml() {
    const names = GACHA_UNITS.filter((u) => !u.promo).map((u) => `<strong>${escapeHtml(u.name)}</strong> (${escapeHtml(u.rarity)})`);
    return names.join(" · ");
  }

  /** Catálogo visual por rareza (pestañas + scroll horizontal). */
  function buildGachaRecruitmentCatalogHtml() {
    const pool = GACHA_UNITS.filter((u) => !u.promo);
    const tiers = ["SSS", "SS", "S", "A", "B"];
    let html = `<section class="gacha-recruit-showcase" aria-label="Catálogo de unidades reclutables">
      <div class="gacha-showcase-head">
        <h3 class="gacha-showcase-title">Atlas de reclutas</h3>
        <p class="muted gacha-showcase-hint">Elige una rareza y <strong>desplázate</strong> con la rueda del ratón o las flechas ◀ ▶. El resultado de cada tirada sigue siendo aleatorio según el banner.</p>
      </div>
      <div class="gacha-catalog-tabs" role="tablist">`;
    tiers.forEach((r, i) => {
      const count = pool.filter((u) => u.rarity === r).length;
      html += `<button type="button" role="tab" class="gacha-cat-tab${i === 0 ? " on" : ""}" data-gacha-rarity="${escapeHtml(r)}" aria-selected="${i === 0 ? "true" : "false"}">${escapeHtml(r)} <span class="gacha-tab-count">${count}</span></button>`;
    });
    html += `</div>`;
    tiers.forEach((r, i) => {
      const units = pool.filter((u) => u.rarity === r);
      html += `<div class="gacha-cat-panel${i === 0 ? " gacha-cat-panel--active" : ""}" role="tabpanel" data-gacha-panel="${escapeHtml(r)}">`;
      html += `<div class="gacha-cat-toolbar">
        <button type="button" class="ghost gacha-cat-nudge" data-gacha-scroll="-1" title="Desplazar a la izquierda">◀</button>
        <span class="gacha-cat-label rarity-${escapeHtml(r)}">Rango ${escapeHtml(r)}</span>
        <button type="button" class="ghost gacha-cat-nudge" data-gacha-scroll="1" title="Desplazar a la derecha">▶</button>
      </div>
      <div class="gacha-cat-scroll" data-gacha-scrollport="${escapeHtml(r)}">`;
      if (!units.length) {
        html += `<p class="muted gacha-cat-empty">No hay unidades de este rango en el pool común.</p>`;
      } else {
        units.forEach((u) => {
          html += `<article class="gacha-cat-card gacha-cat-card--${escapeHtml(u.rarity)}">
            <div class="gacha-cat-card-frame">
              <img src="${escapeAttrUrl(u.img)}" alt="" loading="lazy" onerror="this.style.opacity=0.35" />
              <span class="gacha-cat-rarity-pill rarity-${escapeHtml(u.rarity)}">${escapeHtml(u.rarity)}</span>
            </div>
            <div class="gacha-cat-card-meta">
              <strong class="gacha-cat-card-name">${escapeHtml(u.name)}</strong>
              <span class="gacha-cat-card-sub">${escapeHtml(u.element)} · ${escapeHtml(u.role)}</span>
            </div>
          </article>`;
        });
      }
      html += `</div></div>`;
    });
    const promos = GACHA_UNITS.filter((u) => u.promo);
    if (promos.length) {
      html += `<div class="gacha-promo-strip">
        <p class="gacha-promo-strip-title">Unidades promo · tirada premium (~1%)</p>
        <div class="gacha-cat-scroll gacha-promo-scroll">`;
      promos.forEach((u) => {
        html += `<article class="gacha-cat-card gacha-cat-card--SSS">
          <div class="gacha-cat-card-frame">
            <img src="${escapeAttrUrl(u.img)}" alt="" loading="lazy" onerror="this.style.opacity=0.35" />
            <span class="gacha-cat-rarity-pill rarity-SSS">SSS</span>
          </div>
          <div class="gacha-cat-card-meta">
            <strong class="gacha-cat-card-name">${escapeHtml(u.name)}</strong>
            <span class="gacha-cat-card-sub">${escapeHtml(u.element)} · ${escapeHtml(u.role)}</span>
          </div>
        </article>`;
      });
      html += `</div></div>`;
    }
    html += `</section>`;
    return html;
  }

  function bindGachaCatalogUi(container) {
    if (!container) return;
    container.querySelectorAll(".gacha-cat-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        const r = btn.getAttribute("data-gacha-rarity");
        container.querySelectorAll(".gacha-cat-tab").forEach((b) => {
          b.classList.toggle("on", b === btn);
          b.setAttribute("aria-selected", b === btn ? "true" : "false");
        });
        container.querySelectorAll(".gacha-cat-panel").forEach((p) => {
          const on = p.getAttribute("data-gacha-panel") === r;
          p.classList.toggle("gacha-cat-panel--active", on);
        });
      });
    });
    container.querySelectorAll(".gacha-cat-nudge").forEach((btn) => {
      btn.addEventListener("click", () => {
        const panel = btn.closest(".gacha-cat-panel");
        const port = panel && panel.querySelector(".gacha-cat-scroll");
        if (!port) return;
        const dir = parseInt(btn.getAttribute("data-gacha-scroll"), 10) || 0;
        port.scrollBy({ left: dir * 260, behavior: "smooth" });
      });
    });
  }

  function storyChapterUnlocked(ch) {
    if (!lotgState) return false;
    if (lotgState.floor < ch.unlockFloor) return false;
    if (ch.requiresRosterMin != null && (lotgState.roster || []).length < ch.requiresRosterMin) return false;
    return true;
  }

  function normalizeInventoryItem(it) {
    if (!it || typeof it !== "object") return;
    if (!it.type) it.type = "heal";
    if (it.type === "heal") {
      if (it.healPct == null) it.healPct = 0.35;
      if (!it.desc) it.desc = "Restaura ≈" + Math.round(it.healPct * 100) + "% del HP máximo.";
    } else if (it.type === "sp") {
      if (it.spPct == null) it.spPct = 0.28;
      if (!it.desc) it.desc = "Restaura ≈" + Math.round(it.spPct * 100) + "% del SP máximo.";
    } else if (it.type === "buff") {
      if (it.atkPct == null) it.atkPct = 0.1;
      if (it.turns == null) it.turns = 4;
      if (!it.desc) it.desc = "+" + Math.round(it.atkPct * 100) + "% daño temporal durante varios turnos propios.";
    } else if (it.type === "cleanse") {
      if (!it.desc)
        it.desc = "Elimina silencio, sueño, parálisis, quemadura y congelación en el objetivo.";
    } else if (it.type === "stat") {
      if (it.statBuffPct == null) it.statBuffPct = 0.08;
      if (it.turns == null) it.turns = 5;
      if (!it.desc) it.desc = "Aumenta temporalmente el daño infligido (~+" + Math.round((it.statBuffPct || 0.08) * 100) + "%) varios combates.";
    }
  }

  function migrateLotgState(s) {
    if (!s) return;
    if (!Array.isArray(s.roster)) s.roster = [];
    s.roster = s.roster.filter((u) => u && typeof u === "object");
    if (!Array.isArray(s.gearStash)) s.gearStash = [];
    if (!s.mapRevealed || typeof s.mapRevealed !== "object") s.mapRevealed = {};
    if (!s.mapCellTypes || typeof s.mapCellTypes !== "object") s.mapCellTypes = {};
    if (!s.mapCellDone || typeof s.mapCellDone !== "object") s.mapCellDone = {};
    if (!s.mapCellMeta || typeof s.mapCellMeta !== "object") s.mapCellMeta = {};
    if (typeof s.floorConditionForFloor !== "number" || !Number.isFinite(s.floorConditionForFloor)) s.floorConditionForFloor = 0;
    if (!s.floorAdvanceRule || typeof s.floorAdvanceRule !== "string") s.floorAdvanceRule = "free";
    if (typeof s.floorBossCleared !== "boolean") s.floorBossCleared = true;
    if (typeof s.floorExitKey !== "boolean") s.floorExitKey = true;
    if (typeof s.floorRelicFound !== "boolean") s.floorRelicFound = true;
    if (s.mapBossCellKey != null && typeof s.mapBossCellKey !== "string") s.mapBossCellKey = null;
    if (typeof s.mapFloorForExitCoord !== "number" || !Number.isFinite(s.mapFloorForExitCoord)) s.mapFloorForExitCoord = -1;
    if (!Array.isArray(s.shopPurchaseLog)) s.shopPurchaseLog = [];
    if (s.stagingAllyItemBuff != null && (typeof s.stagingAllyItemBuff !== "object" || !s.stagingAllyItemBuff.uid)) {
      s.stagingAllyItemBuff = null;
    }
    if (typeof s.runCombatAtkMult !== "number" || !Number.isFinite(s.runCombatAtkMult)) s.runCombatAtkMult = 1;
    if (typeof s.runCombatAtkFights !== "number" || !Number.isFinite(s.runCombatAtkFights)) s.runCombatAtkFights = 0;
    if (typeof s.mapPos !== "string" || !/^\s*\d+\s*,\s*\d+\s*$/.test(s.mapPos)) s.mapPos = "2,2";
    if (typeof s.floor !== "number" || !Number.isFinite(s.floor) || s.floor < 1) s.floor = 1;
    if (typeof s.zen !== "number" || !Number.isFinite(s.zen)) s.zen = 0;
    if (s.protag && typeof s.protag === "object") {
      if (!s.protag.stats || typeof s.protag.stats !== "object") s.protag.stats = emptyStats();
      else
        STAT_KEYS.forEach((k) => {
          const v = Number(s.protag.stats[k]);
          s.protag.stats[k] = Number.isFinite(v) ? v : 0;
        });
    }
    if (s.protag && (s.protag.level == null || s.protag.level < 1)) s.protag.level = 1;
    if (s.protag && typeof s.protag === "object") {
      if (!s.protag.lotgElement) s.protag.lotgElement = "Imaginario";
      if (!s.protag.passive || typeof s.protag.passive !== "object") {
        s.protag.passive = {
          name: "Resonancia del juramento",
          desc: "+4% resistencia mágica. Recuperas +2 SP al inicio de cada turno propio en combate.",
        };
      }
      if (!s.protag.skillActive || typeof s.protag.skillActive !== "object") {
        s.protag.skillActive = {
          name: "Trazado Aónico — Grúa clínica",
          desc: "Daño cuántico (MA×1.35). Si hay horda, el daño se reparte con ligera eficiencia de área.",
        };
      }
      if (!s.protagAilments || typeof s.protagAilments !== "object") {
        s.protagAilments = { silence: 0, sleep: 0, burn: 0, freeze: 0, para: 0 };
      }
    }
    if (!s.equipSlots || typeof s.equipSlots !== "object") s.equipSlots = {};
    EQUIP_SLOTS.forEach((sl) => {
      if (!(sl in s.equipSlots)) s.equipSlots[sl] = null;
    });
    if (Array.isArray(s.equipment)) {
      s.equipment.forEach((eq) => {
        const sl = eq.equipSlot && EQUIP_SLOTS.includes(eq.equipSlot) ? eq.equipSlot : "Cuerpo";
        if (!eq.equipSlot || !EQUIP_SLOTS.includes(eq.equipSlot)) eq.equipSlot = sl;
        if (!s.equipSlots[sl]) s.equipSlots[sl] = eq;
        else {
          if (!s.gearStash) s.gearStash = [];
          s.gearStash.push(eq);
        }
      });
      delete s.equipment;
    }
    if (!Array.isArray(s.partyUids)) s.partyUids = [];
    s.partyUids = s.partyUids.filter((uid) => typeof uid === "string").slice(0, MAX_PARTY_ALLIES);
    if (!s.partyVitalsPersist || typeof s.partyVitalsPersist !== "object") s.partyVitalsPersist = {};
    (s.roster || []).forEach((u) => {
      if (!u.uid || typeof u.uid !== "string") u.uid = "u-mig-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
      if (u.mergeRank == null) u.mergeRank = 0;
      if (!u.dupeKey) u.dupeKey = u.name;
      if (u.level == null || u.level < 1) u.level = 1;
      if (u.xp == null || u.xp < 0 || !Number.isFinite(u.xp)) u.xp = 0;
      if (!u.stats || typeof u.stats !== "object") u.stats = emptyStats();
      else
        STAT_KEYS.forEach((k) => {
          const v = Number(u.stats[k]);
          u.stats[k] = Number.isFinite(v) ? v : 0;
        });
      if (!u.equipSlots || typeof u.equipSlots !== "object") u.equipSlots = {};
      EQUIP_SLOTS.forEach((sl) => {
        if (!(sl in u.equipSlots)) u.equipSlots[sl] = null;
      });
      if (!u.element) u.element = "Neutral";
      const tmpl = GACHA_UNITS.find((g) => g.name === u.name);
      if (tmpl && tmpl.passive && !u.passive) u.passive = { name: tmpl.passive.name, desc: tmpl.passive.desc };
      if (tmpl && tmpl.passiveHook && !u.passiveHook) u.passiveHook = tmpl.passiveHook;
    });
    if (!Array.isArray(s.inventory)) s.inventory = [];
    s.inventory.forEach(normalizeInventoryItem);
    if (!Array.isArray(s.gachaLog)) s.gachaLog = [];
    if (s.gachaLog.length > 80) s.gachaLog = s.gachaLog.slice(-80);
    (s.gearStash || []).forEach((eq) => {
      if (!eq.equipSlot || !EQUIP_SLOTS.includes(eq.equipSlot)) {
        eq.equipSlot = EQUIP_SLOTS[Math.floor(Math.random() * EQUIP_SLOTS.length)];
      }
    });
    if (!s.storyChoiceLog) s.storyChoiceLog = [];
    if (!s.combatBuff || typeof s.combatBuff !== "object") s.combatBuff = { atkMult: 1, turns: 0 };
    if (!s.protagBattleMods || typeof s.protagBattleMods !== "object") s.protagBattleMods = { physPct: 0, magPct: 0, turns: 0 };
    const r = s.roster || [];
    s.partyUids = (s.partyUids || []).filter((uid) => r.some((u) => u.uid === uid)).slice(0, MAX_PARTY_ALLIES);
    const ruids = new Set(r.map((u) => u.uid));
    Object.keys(s.partyVitalsPersist || {}).forEach((uid) => {
      if (!ruids.has(uid)) delete s.partyVitalsPersist[uid];
    });
    if (s.mapLayoutFloor == null && Object.keys(s.mapCellTypes || {}).length > 0) {
      s.mapLayoutFloor = s.floor || 1;
    }
    if (!Array.isArray(s.ownedSkillIds)) s.ownedSkillIds = [];
    if (!Array.isArray(s.equippedSkillsProtag)) s.equippedSkillsProtag = [];
    s.equippedSkillsProtag = s.equippedSkillsProtag.filter((id) => typeof id === "string").slice(0, 4);
    if (!s.socialLinks || typeof s.socialLinks !== "object") s.socialLinks = {};
    if (!Array.isArray(s.activeSideQuests)) s.activeSideQuests = [];
    if (!Array.isArray(s.completedQuestIds)) s.completedQuestIds = [];
    if (typeof s.shopSoulPurchases !== "number" || !Number.isFinite(s.shopSoulPurchases)) s.shopSoulPurchases = 0;
    if (!s.giftInventory || typeof s.giftInventory !== "object") s.giftInventory = {};
    (s.roster || []).forEach((u) => {
      if (!Array.isArray(u.equippedSkills)) u.equippedSkills = [];
      u.equippedSkills = u.equippedSkills.filter((id) => typeof id === "string").slice(0, 4);
    });
    lotgMigrateExclusiveSkills(s);
  }

  /** Reglas de salida de piso (jefe cada 3 pisos, llave, reliquia o libre). */
  function ensureFloorExitConditions() {
    if (!lotgState) return;
    const f = lotgState.floor || 1;
    if (lotgState.floorConditionForFloor === f) return;
    lotgState.floorConditionForFloor = f;
    lotgState.mapBossCellKey = null;
    if (f % 3 === 0) {
      lotgState.floorAdvanceRule = "boss";
      lotgState.floorBossCleared = false;
      lotgState.floorExitKey = true;
      lotgState.floorRelicFound = true;
    } else {
      const r = Math.random();
      if (r < 0.28) {
        lotgState.floorAdvanceRule = "key";
        lotgState.floorBossCleared = true;
        lotgState.floorExitKey = false;
        lotgState.floorRelicFound = true;
      } else if (r < 0.52) {
        lotgState.floorAdvanceRule = "relic";
        lotgState.floorBossCleared = true;
        lotgState.floorExitKey = true;
        lotgState.floorRelicFound = false;
      } else {
        lotgState.floorAdvanceRule = "free";
        lotgState.floorBossCleared = true;
        lotgState.floorExitKey = true;
        lotgState.floorRelicFound = true;
      }
    }
  }

  function bindLotgSubnav(wrap) {
    wrap.querySelectorAll("[data-lotg-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (inLotgCombat()) return;
        const tab = btn.getAttribute("data-lotg-tab");
        lotgState.lotgView = tab;
        if (tab === "gacha") lotgState.bannerCommonFour = pickCommonBannerFour();
        lotgSave();
        renderLotgGame();
      });
    });
  }

  function isValidPatimonCatalogEntry(e) {
    return (
      e &&
      typeof e === "object" &&
      typeof e.slot === "string" &&
      typeof e.name === "string" &&
      typeof e.id === "string"
    );
  }

  function loadCustomEquip() {
    try {
      const raw = localStorage.getItem(STORAGE_EQUIP);
      if (raw == null || raw === "" || raw === "null") return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isValidPatimonCatalogEntry);
    } catch {
      return [];
    }
  }
  function saveCustomEquip(arr) {
    try {
      localStorage.setItem(STORAGE_EQUIP, JSON.stringify(arr));
    } catch (e) {
      console.error(e);
      alert("No se pudo guardar el catálogo en el navegador (almacenamiento lleno o modo privado). Las piezas personalizadas pueden no conservarse.");
    }
  }

  /** Fusiona entradas remotas (JSON del repo) y locales (mismo id → gana la local). */
  function mergePatimonCustomCatalog(remoteArr, localArr) {
    const m = new Map();
    (remoteArr || []).forEach((e) => {
      if (isValidPatimonCatalogEntry(e)) m.set(e.id, e);
    });
    (localArr || []).forEach((e) => {
      if (isValidPatimonCatalogEntry(e)) m.set(e.id, e);
    });
    return Array.from(m.values());
  }

  function allEquip() {
    const customMerged = mergePatimonCustomCatalog(patimonRemoteCatalog, loadCustomEquip());
    return DEFAULT_EQUIP.concat(customMerged);
  }

  function isDefaultPatimonId(id) {
    return String(id || "").startsWith("def-");
  }

  /** Piezas creadas por usuarios (no el set de ejemplo en JS) para el archivo JSON del repositorio. */
  function getExportablePatimonCatalogForRepo() {
    return mergePatimonCustomCatalog(patimonRemoteCatalog, loadCustomEquip()).filter((e) => !isDefaultPatimonId(e.id));
  }

  function downloadPatimonCatalogForGithub() {
    const filename = "patimon-catalog.json";
    try {
      const data = getExportablePatimonCatalogForRepo();
      const json = JSON.stringify(data, null, 2);
      /* octet-stream evita que el navegador abra el JSON en pestaña en lugar de descargar */
      const blob = new Blob([json], { type: "application/octet-stream" });

      if (typeof navigator !== "undefined" && typeof navigator.msSaveBlob === "function") {
        navigator.msSaveBlob(blob, filename);
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", filename);
      a.download = filename;
      a.rel = "noopener";
      a.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0.01;pointer-events:none;";
      (document.body || document.documentElement).appendChild(a);
      if (typeof a.click === "function") {
        a.click();
      } else {
        const ev = document.createEvent("MouseEvents");
        ev.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(ev);
      }
      setTimeout(function () {
        if (a.parentNode) a.parentNode.removeChild(a);
        URL.revokeObjectURL(url);
      }, 8000);
    } catch (err) {
      console.error("[Patimon] export", err);
      alert("No se pudo generar la descarga. Revisa la consola (F12).");
    }
  }

  function updatePatimonCatalogStatusUi() {
    const el = document.getElementById("patimonCatalogStatus");
    if (!el) return;
    const nRem = patimonRemoteCatalog.filter(isValidPatimonCatalogEntry).length;
    const nLoc = loadCustomEquip().filter(isValidPatimonCatalogEntry).length;
    const nExp = getExportablePatimonCatalogForRepo().length;
    el.innerHTML =
      "Catálogo público (archivo <code>data/patimon-catalog.json</code>): <strong>" +
      nRem +
      "</strong> pieza(s) cargadas desde el servidor. " +
      "En este navegador hay <strong>" +
      nLoc +
      "</strong> en almacenamiento local. " +
      "Exportación para el repo: <strong>" +
      nExp +
      "</strong> pieza(s) (sin el set de ejemplo Draconyr Pyro).";
  }

  function fetchPatimonPublicCatalog() {
    const url = new URL(PATIMON_CATALOG_URL, window.location.href).href;
    return fetch(url, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          patimonRemoteCatalog = [];
          return;
        }
        patimonRemoteCatalog = data.filter(isValidPatimonCatalogEntry);
      })
      .catch((err) => {
        console.warn("[Patimon] No se pudo cargar el catálogo público (normal si abres el HTML en file:// o falta data/patimon-catalog.json):", err && err.message ? err.message : err);
        patimonRemoteCatalog = [];
      });
  }

  function buildStatForm() {
    const wrap = document.getElementById("formStatInputs");
    if (!wrap) return;
    wrap.innerHTML = "";
    STAT_KEYS.forEach((k) => {
      const d = document.createElement("div");
      d.innerHTML = `<label>${k}</label><input type="number" name="st_${k}" value="0" min="0" max="999" />
        <input type="text" name="sd_${k}" placeholder="Desc. sub-stat ${k}" style="margin-top:4px" />`;
      wrap.appendChild(d);
    });
  }

  function renderSlotFilters() {
    const el = document.getElementById("slotFilters");
    if (!el) return;
    const slots = ["all", "Cabeza", "Cuerpo", "Arma", "Accesorio"];
    el.innerHTML = slots
      .map((s) => {
        const label = s === "all" ? "Todos" : s;
        return `<button type="button" class="${filterSlot === s ? "on" : ""}" data-slot="${s}">${label}</button>`;
      })
      .join("");
    el.querySelectorAll("button").forEach((b) => {
      b.addEventListener("click", () => {
        filterSlot = b.getAttribute("data-slot");
        renderSlotFilters();
        renderEquipGrid();
      });
    });
  }

  function statBlockHtml(stats, subLines) {
    const parts = STAT_KEYS.map((k) => {
      const v = stats[k] != null ? stats[k] : 0;
      const sub = subLines && subLines[k] ? `<div class="muted" style="font-size:0.7rem">${escapeHtml(subLines[k])}</div>` : "";
      return `<div><span>${k}</span> <strong>${v}</strong>${sub}</div>`;
    });
    return `<div class="stat-grid">${parts.join("")}</div>`;
  }

  function escapeHtml(s) {
    if (!s) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Para atributo src (rutas y data URLs); no convierte &lt; para no romper imágenes base64. */
  function escapeAttrUrl(s) {
    if (s == null || s === "") return "";
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  }

  function renderEquipGrid() {
    const grid = document.getElementById("equipGrid");
    if (!grid) return;
    const list = allEquip().filter((e) => filterSlot === "all" || e.slot === filterSlot);
    grid.innerHTML = list
      .map((e) => {
        const sk = e.skill || {};
        const isCustom = !isDefaultPatimonId(e.id);
        const subLines = e.subStatLines || {};
        return `
        <article class="equip-card" data-id="${escapeHtml(e.id)}">
          <div class="img-wrap"><img src="${escapeHtml(e.imageUrl)}" alt="" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML+='<span class=muted>Sin imagen</span>'" /></div>
          <div class="body">
            <span class="slot-tag slot-${escapeHtml(e.slot)}">${escapeHtml(e.slot)}</span>
            <h3 style="margin:0;font-size:1rem">${escapeHtml(e.name)}</h3>
            <p class="muted" style="margin:0.35rem 0;font-size:0.8rem">Set: <code>${escapeHtml(e.setId)}</code> · ${escapeHtml(e.element || "—")}</p>
            <p style="font-size:0.85rem">${escapeHtml(e.descPiece || "")}</p>
            ${statBlockHtml(e.stats || {}, subLines)}
            <p style="font-size:0.8rem;margin-top:0.5rem"><strong>Sub-stats (texto):</strong> ${escapeHtml(e.subStatsDesc || "")}</p>
            <p style="font-size:0.8rem"><strong>Bono set completo:</strong> ${escapeHtml(e.setBonus || "")}</p>
            <h3 style="font-size:0.9rem">Habilidad de set completo</h3>
            <p style="font-size:0.8rem;margin:0"><strong>${escapeHtml(sk.name || "—")}</strong> · SP ${sk.sp != null ? sk.sp : "—"} · CD ${sk.cd != null ? sk.cd : "—"} · Usos ${sk.uses != null ? sk.uses : "—"}</p>
            <p style="font-size:0.8rem;margin:0.25rem 0"><strong>Daño:</strong> ${escapeHtml(sk.dmg || "—")}</p>
            <p style="font-size:0.8rem;margin:0"><strong>Condición:</strong> ${escapeHtml(sk.cond || "—")}</p>
            <p style="font-size:0.8rem">${escapeHtml(sk.desc || "")}</p>
            ${isCustom ? `<div class="btn-row"><button type="button" class="ghost danger" data-del="${escapeHtml(e.id)}">Eliminar pieza</button></div>` : ""}
          </div>
        </article>`;
      })
      .join("");

    grid.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-del");
        if (!confirm("¿Eliminar esta pieza?")) return;
        const hadLocal = loadCustomEquip().some((x) => x.id === id);
        if (hadLocal) {
          const next = loadCustomEquip().filter((x) => x.id !== id);
          saveCustomEquip(next);
          renderEquipGrid();
          updatePatimonCatalogStatusUi();
          return;
        }
        const hadRemote = patimonRemoteCatalog.some((x) => x.id === id);
        if (hadRemote) {
          alert(
            "Esta pieza solo está en el archivo data/patimon-catalog.json del repositorio.\n\nPara quitarla: edita ese JSON en GitHub (o en tu copia local), borra la entrada, exporta de nuevo si hace falta, y sube los cambios con git."
          );
          return;
        }
        renderEquipGrid();
      });
    });
  }

  /* Audio / música: fuera de try/catch para que LOTG y el resto del IIFE puedan llamar playLotgTrack, etc. */
  const bgmGlobal = document.getElementById("bgmGlobal");
  const bgmLotg = document.getElementById("bgmLotg");
  const nowPlayingEl = document.getElementById("nowPlaying");
  const masterVol = document.getElementById("masterVol");

  function setVol() {
    if (!masterVol) return;
    const v = (parseInt(masterVol.value, 10) || 0) / 100;
    if (bgmGlobal) bgmGlobal.volume = v;
    if (bgmLotg) bgmLotg.volume = v;
  }
  if (masterVol) masterVol.addEventListener("input", setVol);

  function playGlobalClinic() {
    tryPlayAudio(bgmGlobal, MUSIC.clinic, "Clinic");
    if (nowPlayingEl) nowPlayingEl.textContent = "Música: Clinic (sitio)";
    try {
      if (bgmLotg) bgmLotg.pause();
    } catch (e) {}
  }

  function playLotgTrack(key, label) {
    const urls = MUSIC[key];
    if (!urls) return;
    try {
      if (bgmGlobal) bgmGlobal.pause();
    } catch (e) {}
    tryPlayAudio(bgmLotg, urls, label);
    if (nowPlayingEl) nowPlayingEl.textContent = "Música: " + label + " (minijuego)";
  }

  /** Historia: no reiniciar pista si el tono no cambia (evita cortes al pulsar Continuar). */
  let lastVnStoryMood = null;
  function resetVnStoryMusicState() {
    lastVnStoryMood = null;
  }
  /** Historia: una base por tono (calma / tensión / serio), sin azar. */
  function playStoryMood(mood) {
    const m = mood === "tension" || mood === "serious" || mood === "calm" ? mood : "calm";
    if (lastVnStoryMood === m) return;
    lastVnStoryMood = m;
    if (m === "tension") playLotgTrack("omen", "Historia — tensión");
    else if (m === "serious") playLotgTrack("chill", "Historia — serio");
    else playLotgTrack("youthful", "Historia — calma");
  }

  try {
  (function () {
    const btnAdd = document.getElementById("btnAddEquip");
    if (btnAdd) {
      btnAdd.addEventListener("click", () => {
        const m = document.getElementById("modalEquip");
        if (m) m.classList.add("open");
      });
    }
  })();
  (function () {
    const btnClose = document.getElementById("modalEquipClose");
    if (btnClose) {
      btnClose.addEventListener("click", () => {
        const m = document.getElementById("modalEquip");
        if (m) m.classList.remove("open");
      });
    }
  })();

  (function () {
    const formEquip = document.getElementById("formEquip");
    if (!formEquip) return;
    formEquip.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const f = ev.target;
    const stats = {};
    const subStatLines = {};
    STAT_KEYS.forEach((k) => {
      stats[k] = parseInt(f["st_" + k].value, 10) || 0;
      const sd = f["sd_" + k].value.trim();
      if (sd) subStatLines[k] = sd;
    });
    const fileInp = f.image;
    const finish = (imageUrl) => {
      const id = "usr-" + Date.now();
      const item = {
        id,
        slot: f.slot.value,
        name: f.name.value.trim(),
        setId: f.setId.value.trim(),
        element: f.element.value.trim(),
        descPiece: f.descPiece.value.trim(),
        stats,
        subStatLines,
        subStatsDesc: f.subStatsDesc.value.trim(),
        setBonus: f.setBonus.value.trim(),
        skill: {
          name: f.skillName.value.trim(),
          sp: parseInt(f.skillSp.value, 10) || 0,
          cd: parseInt(f.skillCd.value, 10) || 0,
          uses: parseInt(f.skillUses.value, 10) || 0,
          dmg: f.skillDmg.value.trim(),
          cond: f.skillCond.value.trim(),
          desc: f.skillDesc.value.trim(),
        },
        imageUrl: imageUrl || "Patimon/placeholder.png",
      };
      const cur = loadCustomEquip();
      cur.push(item);
      saveCustomEquip(cur);
      const modal = document.getElementById("modalEquip");
      if (modal) modal.classList.remove("open");
      f.reset();
      buildStatForm();
      renderEquipGrid();
      updatePatimonCatalogStatusUi();
    };
    if (fileInp.files && fileInp.files[0]) {
      const r = new FileReader();
      r.onload = () => finish(r.result);
      r.readAsDataURL(fileInp.files[0]);
    } else {
      finish("");
    }
    });
  })();

  document.querySelectorAll("#mainNav button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sec = btn.getAttribute("data-section");
      document.querySelectorAll("#mainNav button").forEach((b) => {
        if (b === btn) b.classList.add("active");
        else b.classList.remove("active");
      });
      document.querySelectorAll("main section.panel").forEach((p) => p.classList.remove("active"));
      const map = { equip: "sec-equip", tutorial: "sec-tutorial", lotg: "sec-lotg" };
      const targetPanel = document.getElementById(map[sec]);
      if (targetPanel) targetPanel.classList.add("active");
      if (sec === "lotg") {
        playLotgTrack("safe", "Safe Area");
      } else {
        playGlobalClinic();
      }
    });
  });

  window.KBK_APP_SHELL_OK = true;
  } catch (e) {
    console.error("[KBK — interfaz principal]", e);
    window.KBK_APP_SHELL_ERROR = (e && e.message) || String(e);
  }

  function combatBgFromWrap() {
    const w = document.getElementById("lotgGameWrap");
    return w && w.dataset ? w.dataset.cbg : undefined;
  }

  /* --- LOTG --- */
  function emptyStats() {
    const o = {};
    STAT_KEYS.forEach((k) => (o[k] = 0));
    return o;
  }

  function createLotgCharacter(data) {
    const stats = emptyStats();
    STAT_KEYS.forEach((k) => {
      stats[k] = data.stats[k] || 0;
    });
    let avatar = null;
    if (data.avatarDataUrl) avatar = data.avatarDataUrl;
    else if (data.avatarPreset === "lawliet") avatar = "Char/Lawliet.png";
    else if (data.avatarPreset === "lawlietg") avatar = "Char/LawlietG.png";
    return {
      name: data.name || "Protagonista",
      gender: data.gender,
      avatar,
      stats,
      statPoints: 0,
      level: 1,
      xp: 0,
      hpCur: 0,
      spCur: 0,
      lotgElement: "Imaginario",
      passive: {
        name: "Resonancia del juramento",
        desc: "+4% resistencia mágica. +2 SP al inicio de cada turno propio en combate.",
      },
      skillActive: {
        name: "Trazado Aónico — Grúa clínica",
        desc: "Técnica definitiva: daño cuántico basado en MA; eficaz contra hordas (reparto en área).",
      },
    };
  }

  function protagCombatStats(p) {
    if (!p || !p.stats) {
      const z = emptyStats();
      return {
        hpMax: Math.floor(44 + z.HP * 11 + z.VI * 5 + z.EN * 4.8),
        spMax: Math.floor(24 + z.SP * 8 + z.MA * 3),
        atkP: Math.floor(8 + z.STG * 2.55 + z.DX * 0.62),
        atkM: Math.floor(6 + z.MA * 2.55 + z.SP * 0.28),
        def: Math.floor(4 + z.VI * 0.72 + z.EN * 1.08 + z.DX * 0.2),
        agi: Math.floor(z.AG * 1.28 + z.LUK * 0.45 + z.DX * 0.34),
      };
    }
    const s = p.stats;
    const lv = p.level != null && p.level >= 1 ? p.level : 1;
    const mult = 1 + (lv - 1) * 0.04;
    const hpMax = Math.floor((44 + s.HP * 11 + s.VI * 5 + s.EN * 4.8) * mult);
    const spMax = Math.floor((24 + s.SP * 8 + s.MA * 3) * mult);
    const atkP = Math.floor((8 + s.STG * 2.55 + s.DX * 0.62) * mult);
    const atkM = Math.floor((6 + s.MA * 2.55 + s.SP * 0.28) * mult);
    const def = Math.floor((4 + s.VI * 0.72 + s.EN * 1.08 + s.DX * 0.2) * mult);
    const agi = Math.floor((s.AG * 1.28 + s.LUK * 0.45 + s.DX * 0.34) * mult);
    return { hpMax, spMax, atkP, atkM, def, agi };
  }

  function getPartyUnits() {
    if (!lotgState || !Array.isArray(lotgState.partyUids)) return [];
    return lotgState.partyUids
      .slice(0, MAX_PARTY_ALLIES)
      .map((uid) => (lotgState.roster || []).find((u) => u && u.uid === uid))
      .filter(Boolean);
  }

  function allyBonusFromParty() {
    let b = { hp: 0, atk: 0, def: 0 };
    getPartyUnits().forEach((u) => {
      const r =
        u.rarity === "SSS" ? 0.12 : u.rarity === "SS" ? 0.1 : u.rarity === "S" ? 0.08 : u.rarity === "A" ? 0.05 : 0.03;
      const mrg = 1 + Math.min(MAX_MERGE_RANK, u.mergeRank || 0) * 0.02;
      b.hp += r * 0.5 * mrg;
      b.atk += r * mrg;
      b.def += r * 0.5 * mrg;
    });
    const damp = 0.52;
    return { hp: b.hp * damp, atk: b.atk * damp, def: b.def * damp };
  }

  function mergeStatsWithEquipSlots(baseStats, slots) {
    const s = { ...baseStats };
    if (!slots) return s;
    EQUIP_SLOTS.forEach((sl) => {
      const eq = slots[sl];
      if (!eq || !eq.bonus) return;
      Object.entries(eq.bonus).forEach(([k, v]) => {
        s[k] = (s[k] || 0) + (Number(v) || 0);
      });
    });
    return s;
  }

  /** Bonus al daño si el arma tiene vínculo exclusivo y el nombre del portador coincide (substring). */
  function equipUniqueBondMultiplier(weaponPiece, unit) {
    const ub = weaponPiece && weaponPiece.uniqueBond;
    if (!ub || !ub.match || !unit) return 1;
    const nm = String(unit.name || "");
    if (nm.indexOf(ub.match) < 0) return 1;
    return 1 + (Number(ub.dmgBonus) || 0);
  }

  /** Bonus extra al ATK de combate si hay arma equipada (STG/DX/MA del arma pesan más en el multiplicador). */
  function equipWeaponDamageMultiplier(slots, bondUnit) {
    const w = slots && slots.Arma;
    if (!w) return 1;
    const fp = w.forgePlus != null ? Math.min(10, Math.max(0, Math.floor(Number(w.forgePlus) || 0))) : 0;
    const forgeMul = fp > 0 ? 1 + fp * 0.042 : 1;
    const bondMul = equipUniqueBondMultiplier(w, bondUnit);
    if (!w.bonus) return forgeMul * bondMul;
    const b = w.bonus;
    const stg = Number(b.STG) || 0;
    const dx = Number(b.DX) || 0;
    const ma = Number(b.MA) || 0;
    const n = stg + dx + ma;
    let m = 1.18 + stg * 0.0065 + dx * 0.0042 + ma * 0.0036 + n * 0.008;
    if (w.qual === "S") m += 0.072;
    else if (w.qual === "SS") m += 0.115;
    else if (w.qual === "SSS") m += 0.16;
    return Math.min(1.88, Math.min(1.62, m) * forgeMul * bondMul);
  }

  function allyConsumableBuffMult(vitals) {
    if (!vitals || !vitals.consumableBuffTurns || vitals.consumableBuffTurns <= 0) return 1;
    return vitals.consumableBuffMult > 0 ? vitals.consumableBuffMult : 1;
  }

  function mitigationPhysFromStats(st, lvMult) {
    const m = lvMult || 1;
    return Math.min(
      0.58,
      ((st.EN || 0) * 0.014 + (st.VI || 0) * 0.009 + (st.DX || 0) * 0.0045) * m
    );
  }

  function mitigationMagFromStats(st, lvMult) {
    const m = lvMult || 1;
    return Math.min(
      0.55,
      ((st.MA || 0) * 0.013 + (st.SP || 0) * 0.006 + (st.VI || 0) * 0.005) * m
    );
  }

  function dodgeFromStats(st, lvMult) {
    const m = lvMult || 1;
    return Math.min(0.34, ((st.AG || 0) * 0.0034 + (st.LUK || 0) * 0.0024 + (st.DX || 0) * 0.002) * m);
  }

  function critChanceFromStats(st) {
    return Math.min(0.4, 0.05 + (st.LUK || 0) * 0.0035 + (st.DX || 0) * 0.0012);
  }

  function getProtagDerivedDefense() {
    if (!lotgState || !lotgState.protag) {
      return { phys: 0.15, mag: 0.15, dodge: 0.05, crit: 0.05 };
    }
    const p = lotgState.protag;
    const s = mergeStatsWithEquipSlots(p.stats, lotgState.equipSlots || {});
    const mult = 1 + (p.level - 1) * 0.04;
    const ab = allyBonusFromParty();
    const passMag = p.passive && p.passive.name ? 1.04 : 1;
    return {
      phys: Math.min(0.6, mitigationPhysFromStats(s, mult) + ab.def * 0.045),
      mag: Math.min(0.6, mitigationMagFromStats(s, mult) * passMag + ab.def * 0.038),
      dodge: Math.min(0.36, dodgeFromStats(s, mult) + ab.def * 0.022),
      crit: critChanceFromStats(s),
    };
  }

  function allyDerivedDefense(u, magic) {
    const s = mergeStatsWithEquipSlots(u.stats || {}, u.equipSlots || {});
    const mult = 1 + ((u.level || 1) - 1) * 0.038;
    return magic ? mitigationMagFromStats(s, mult) : mitigationPhysFromStats(s, mult);
  }

  function allyDodgeChance(u) {
    const s = mergeStatsWithEquipSlots(u.stats || {}, u.equipSlots || {});
    const mult = 1 + ((u.level || 1) - 1) * 0.038;
    return dodgeFromStats(s, mult);
  }

  function enemyLevelMult(e) {
    return 1 + ((e.level || 1) - 1) * 0.038;
  }

  function enemyStatsWithDebuffs(e) {
    const st = { ...(e && e.stats ? e.stats : emptyStats()) };
    const deb = e && e.lotgEnemyDebuff;
    if (deb && (deb.turns || 0) > 0) {
      if (deb.enFlat) st.EN = Math.max(0, (st.EN || 0) - Math.floor(deb.enFlat));
      if (deb.viFlat) st.VI = Math.max(0, (st.VI || 0) - Math.floor(deb.viFlat));
      if (deb.maFlat) st.MA = Math.max(0, (st.MA || 0) - Math.floor(deb.maFlat));
    }
    return st;
  }

  function enemyMitigationPhys(e) {
    return mitigationPhysFromStats(enemyStatsWithDebuffs(e), enemyLevelMult(e));
  }

  function enemyMitigationMag(e) {
    return mitigationMagFromStats(enemyStatsWithDebuffs(e), enemyLevelMult(e));
  }

  function damageToEnemyPhysical(raw, e) {
    const mit = enemyMitigationPhys(e);
    let dmg = Math.max(1, Math.floor(raw * (1 - mit)));
    if (e && e.lotgVulnerable && (e.lotgVulnerable.turns || 0) > 0) {
      dmg = Math.floor(dmg * (1 + (e.lotgVulnerable.pct || 0)));
    }
    return Math.max(1, dmg);
  }

  function damageToEnemyMagical(raw, e) {
    const mit = enemyMitigationMag(e);
    let dmg = Math.max(1, Math.floor(raw * (1 - mit)));
    if (e && e.lotgVulnerable && (e.lotgVulnerable.turns || 0) > 0) {
      dmg = Math.floor(dmg * (1 + (e.lotgVulnerable.pct || 0)));
    }
    return Math.max(1, dmg);
  }

  /**
   * Fórmulas base LOTG: daño bruto antes de mitigación enemiga.
   * físico ≈ atkP × mult × variación; mágico ≈ atkM × mult × variación (ligeramente más alto en coef).
   */
  function lotgProtagPhysicalRaw(cs, atkMult, buffMult) {
    const merged = mergeStatsWithEquipSlots((lotgState && lotgState.protag && lotgState.protag.stats) || emptyStats(), (lotgState && lotgState.equipSlots) || {});
    const wStat = getWeaponDamageStatBonusFromSlots((lotgState && lotgState.equipSlots) || {}, "STG");
    const accSyn = lotgAccessorySynergyPct((lotgState && lotgState.equipSlots) || {}, merged, "phys");
    const physScale = LOTG_DAMAGE_SCALING.phys;
    const core = (merged.STG || 0) * physScale.stg + wStat * physScale.weapon + (merged.DX || 0) * physScale.dx;
    let stance = 1;
    if (lotgState && lotgState.protagBattleMods && (lotgState.protagBattleMods.turns || 0) > 0) {
      stance += lotgState.protagBattleMods.physPct || 0;
    }
    const m = (atkMult || 1) * (buffMult || 1) * 1.13 * stance * (1 + wStat * 0.006 + accSyn);
    return (cs.atkP * 0.62 + core * 2.15) * m * (0.95 + Math.random() * 0.31);
  }

  function lotgProtagMagicalRaw(cs, atkMult, buffMult, skillCoef) {
    const c = skillCoef != null ? skillCoef : 1.35;
    const merged = mergeStatsWithEquipSlots((lotgState && lotgState.protag && lotgState.protag.stats) || emptyStats(), (lotgState && lotgState.equipSlots) || {});
    const wStat = getWeaponDamageStatBonusFromSlots((lotgState && lotgState.equipSlots) || {}, "MA");
    const accSyn = lotgAccessorySynergyPct((lotgState && lotgState.equipSlots) || {}, merged, "mag");
    const magScale = LOTG_DAMAGE_SCALING.mag;
    const core = (merged.MA || 0) * magScale.ma + wStat * magScale.weapon + (merged.SP || 0) * magScale.sp;
    let stance = 1;
    if (lotgState && lotgState.protagBattleMods && (lotgState.protagBattleMods.turns || 0) > 0) {
      stance += lotgState.protagBattleMods.magPct || 0;
    }
    const m = (atkMult || 1) * (buffMult || 1) * 1.13 * stance * (1 + wStat * 0.0058 + accSyn);
    return (cs.atkM * 0.58 + core * 2.1) * c * m * (1.08 + Math.random() * 0.32);
  }

  function lotgProtagFirearmRaw(cs, atkMult, buffMult, skillCoef) {
    const c = skillCoef != null ? skillCoef : 1.2;
    const slots = (lotgState && lotgState.equipSlots) || {};
    const merged = mergeStatsWithEquipSlots((lotgState && lotgState.protag && lotgState.protag.stats) || emptyStats(), slots);
    const dxBoost = getWeaponDamageStatBonusFromSlots(slots, "DX");
    const st = merged || emptyStats();
    const fireScale = LOTG_DAMAGE_SCALING.firearm;
    const firearmCore = (st.DX || 0) * fireScale.dx + dxBoost * fireScale.weapon + (st.STG || 0) * fireScale.stg;
    const accSyn = lotgAccessorySynergyPct(slots, merged, "firearm");
    const m = (atkMult || 1) * (buffMult || 1) * (1 + accSyn) * (1.02 + Math.random() * 0.26);
    return (cs.atkP * 0.42 + firearmCore * 2.4) * c * m;
  }

  function allyFirearmRaw(u, vitals, atkMult, skillCoef) {
    const c = skillCoef != null ? skillCoef : 1.12;
    const st = allyCombatStats(u);
    const merged = mergeStatsWithEquipSlots(u.stats || {}, u.equipSlots || {});
    const dxBoost = getWeaponDamageStatBonusFromSlots(u.equipSlots || {}, "DX");
    const fireScale = LOTG_DAMAGE_SCALING.firearm;
    const firearmCore = ((merged.DX || 0) * fireScale.dx + dxBoost * fireScale.weapon + (merged.STG || 0) * fireScale.stg) * c;
    const syn = lotgAccessorySynergyPct(u.equipSlots || {}, merged, "firearm");
    const stance = allyBattleStancePhys(vitals);
    return (st.atkP * 0.4 + firearmCore * 2.28) * (atkMult || 1) * (1 + syn) * stance * (0.96 + Math.random() * 0.24);
  }

  function rollEnemyAttackDamage(enemy, target, damageMult) {
    const es = enemyStatsWithDebuffs(enemy);
    const useMag = Math.random() < 0.26 + Math.min(0.18, (es.MA || 0) / ((es.STG || 0) + (es.MA || 0) + 8));
    let power = useMag
      ? (es.MA || 0) * 2.65 + (es.SP || 0) * 0.5 + (es.LUK || 0) * 0.14
      : (es.STG || 0) * 2.48 + (es.DX || 0) * 1.28 + (es.LUK || 0) * 0.11;
    const fl = Math.max(1, enemy.floor || 1);
    power *=
      (0.94 + Math.random() * 0.34) *
      (1 + (enemy.level || 1) * 0.058) *
      (1 + fl * 0.024 + Math.min(12, fl) * 0.008) *
      (damageMult != null && damageMult > 0 ? damageMult : 1);
    if (enemy && enemy.lotgOutDamageDebuff && (enemy.lotgOutDamageDebuff.turns || 0) > 0) {
      const cut = Math.min(0.7, Math.max(0, Number(enemy.lotgOutDamageDebuff.pct) || 0));
      power *= 1 - cut;
    }
    if (lotgState && lotgState.combatGuardBuff && (lotgState.combatGuardBuff.turns || 0) > 0) {
      const gp = Math.min(0.7, Math.max(0, Number(lotgState.combatGuardBuff.pct) || 0));
      power *= 1 - gp;
    }
    let defMit;
    let dodgeChance;
    let defLuk = 0;
    let defenderElement = "Neutral";
    if (target.kind === "protag") defenderElement = (lotgState.protag && lotgState.protag.lotgElement) || "Neutral";
    else if (target.u) defenderElement = target.u.element || "Neutral";
    if (target.kind === "protag") {
      const pd = getProtagDerivedDefense();
      defMit = useMag ? pd.mag : pd.phys;
      dodgeChance = pd.dodge;
      defLuk = lotgState.protag.stats.LUK || 0;
    } else {
      defMit = allyDerivedDefense(target.u, useMag);
      dodgeChance = allyDodgeChance(target.u);
      defLuk = (target.u.stats || {}).LUK || 0;
    }
    const dodgeBonus = Math.max(
      0,
      ((target.kind === "protag" ? lotgState.protag.stats.AG : (target.u.stats || {}).AG) || 0) * 0.0006
    );
    if (Math.random() < Math.min(0.38, dodgeChance + dodgeBonus)) {
      return { dmg: 0, dodge: true, mag: useMag };
    }
    let dmg = Math.floor(power * (1 - defMit));
    dmg = Math.floor(dmg * elementalDamageMult(enemy.element || "Neutral", defenderElement));
    const atkLuk = es.LUK || 0;
    const critP = Math.min(0.38, Math.max(0.04, 0.07 + atkLuk * 0.0032 - defLuk * 0.001));
    let crit = false;
    if (Math.random() < critP) {
      dmg = Math.floor(dmg * 1.62);
      crit = true;
    }
    return { dmg: Math.max(4, dmg), crit, mag: useMag };
  }

  function allyCombatStats(u) {
    const st = mergeStatsWithEquipSlots(u.stats || {}, u.equipSlots || {});
    const lv = u.level != null && u.level >= 1 ? u.level : 1;
    const mult = 1 + (lv - 1) * 0.038;
    const mrg = 1 + Math.min(MAX_MERGE_RANK, u.mergeRank || 0) * 0.04;
    const baseHp = 32 + (st.HP || 0) * 9.6 + (st.VI || 0) * 5 + (st.EN || 0) * 3.9;
    const baseSp = 16 + (st.SP || 0) * 7.2 + (st.MA || 0) * 3;
    const baseAtkP = 7 + (st.STG || 0) * 2.4 + (st.DX || 0) * 0.56;
    const baseAtkM = 5 + (st.MA || 0) * 2.45 + (st.SP || 0) * 0.26;
    const baseDef = 3 + (st.VI || 0) * 0.66 + (st.EN || 0) * 1.02 + (st.DX || 0) * 0.2;
    const rareAmp =
      u.rarity === "SSS" ? 1.1 : u.rarity === "SS" ? 1.078 : u.rarity === "S" ? 1.058 : u.rarity === "A" ? 1.04 : 1.025;
    const wpn = equipWeaponDamageMultiplier(u.equipSlots || {}, u);
    const pb = sumLotgEquippedPassivesForUnit(u);
    const sl = (lotgState && lotgState.socialLinks && lotgState.socialLinks[u.uid]) || {};
    const linkLv = Math.min(10, Math.max(0, Math.floor(Number(sl.level) || 0)));
    const linkAmp = sl.partner ? 2 : 1 + linkLv * 0.015;
    const pMag = 1 + (pb.magDmgPct || 0);
    const pPhys = 1 + (pb.physDmgPct || 0);
    const pHp = 1 + (pb.hpPct || 0);
    const pDef = 1 + (pb.defFlat || 0);
    return {
      hpMax: Math.floor(baseHp * mult * mrg * rareAmp * linkAmp * pHp),
      spMax: Math.floor(baseSp * mult * mrg * rareAmp * linkAmp),
      atkP: Math.floor(baseAtkP * mult * mrg * rareAmp * linkAmp * wpn * pPhys),
      atkM: Math.floor(baseAtkM * mult * mrg * rareAmp * linkAmp * wpn * pMag),
      def: Math.floor(baseDef * mult * mrg * rareAmp * linkAmp * pDef),
    };
  }

  /** Guarda HP/SP actuales de aliados en grupo para el mapa (descanso, siguiente combate). */
  function snapshotPartyVitalsToPersist() {
    if (!lotgState || !lotgState.combatAllyVitals) return;
    if (!lotgState.partyVitalsPersist) lotgState.partyVitalsPersist = {};
    getPartyUnits().forEach((u) => {
      const v = lotgState.combatAllyVitals[u.uid];
      if (!v) return;
      const st = allyCombatStats(u);
      lotgState.partyVitalsPersist[u.uid] = {
        hp: Math.max(0, Math.min(st.hpMax, v.hp)),
        sp: Math.max(0, Math.min(st.spMax, v.sp)),
      };
    });
  }

  function computeAllyDamage(u, e, extraMult) {
    const em = (extraMult || 1) * 1.06;
    const st = allyCombatStats(u);
    const v = lotgState && lotgState.combatAllyVitals && lotgState.combatAllyVitals[u.uid];
    const merged = mergeStatsWithEquipSlots(u.stats || {}, u.equipSlots || {});
    const wStg = getWeaponDamageStatBonusFromSlots(u.equipSlots || {}, "STG");
    const physScale = LOTG_DAMAGE_SCALING.phys;
    const core = (merged.STG || 0) * physScale.stg + wStg * physScale.weapon + (merged.DX || 0) * physScale.dx;
    const syn = lotgAccessorySynergyPct(u.equipSlots || {}, merged, "phys");
    let stance = 1;
    if (v && v.battleMods && (v.battleMods.turns || 0) > 0) stance += v.battleMods.physPct || 0;
    const raw = (st.atkP * 0.62 + core * 2.05) * (0.96 + Math.random() * 0.28) * 1.1 * em * stance * (1 + wStg * 0.0054 + syn);
    let dmg = damageToEnemyPhysical(raw, e);
    dmg = Math.floor(dmg * elementalDamageMult(u.element || "Neutral", e.element || "Neutral"));
    return Math.max(1, dmg);
  }

  function lotgEnemyDefenseBandForFloor(floor) {
    const f = Math.max(1, Math.floor(Number(floor) || 1));
    for (let i = 0; i < LOTG_ENEMY_DEF_BANDS.length; i++) {
      const b = LOTG_ENEMY_DEF_BANDS[i];
      if (f >= b.min && f <= b.max) return b;
    }
    return LOTG_ENEMY_DEF_BANDS[LOTG_ENEMY_DEF_BANDS.length - 1];
  }

  function lotgEnemyEnCapFor(floor, boss, miniboss) {
    const f = Math.max(1, Math.floor(Number(floor) || 1));
    const capCfg = boss ? LOTG_ENEMY_EN_CAP.boss : miniboss ? LOTG_ENEMY_EN_CAP.mini : LOTG_ENEMY_EN_CAP.normal;
    return capCfg.base + f * capCfg.perFloor;
  }

  /** Enemigo con mismas stats base que las unidades (HP, SP, STG, DX, MA, …), nivel ≥1 que escala con piso y victorias. */
  function scaleEnemy(floor, boss, extra) {
    extra = extra || {};
    const miniboss = !!extra.miniboss;
    const t = ENEMY_TEMPLATES[(floor + Math.floor(Math.random() * 3)) % ENEMY_TEMPLATES.length];
    const streak = Math.max(0, (lotgState && lotgState.combatsCleared) || 0);
    const danger =
      (1 + floor * 0.128 + streak * 0.042 + Math.min(18, floor) * 0.022) * (boss || miniboss ? 1.06 : 1) *
      (boss || miniboss ? 1 : 0.96);
    const level = Math.max(
      1,
      1 + Math.floor(floor * 0.82 + streak * 0.16 + (boss ? 5 : miniboss ? 4 : 0))
    );
    const budgetBase = Math.floor(
      (28 + level * 8.2 + floor * 4.2 + streak * 1.35 + floor * floor * 0.04) * danger * (boss ? 1.34 : miniboss ? 1.26 : 1)
    );
    const minPerStat = Math.max(2, 2 + Math.floor(level / 12) + (boss ? 1 : 0));
    const floorMinTotal = STAT_KEYS.length * minPerStat;
    const budget = Math.max(budgetBase, floorMinTotal + 12);
    const stats = emptyStats();
    STAT_KEYS.forEach((k) => {
      stats[k] = minPerStat;
    });
    let left = budget - floorMinTotal;
    while (left > 0) {
      stats[STAT_KEYS[Math.floor(Math.random() * STAT_KEYS.length)]]++;
      left--;
    }
    if (boss) {
      STAT_KEYS.forEach((k) => {
        stats[k] += 1 + Math.floor(level / 6);
      });
    } else if (miniboss) {
      STAT_KEYS.forEach((k) => {
        stats[k] += 1 + Math.floor(level / 8);
      });
    }
    const defBand = lotgEnemyDefenseBandForFloor(floor);
    const enBefore = stats.EN;
    const viBefore = stats.VI;
    stats.EN = Math.max(minPerStat, Math.floor(stats.EN * defBand.enMult));
    stats.VI = Math.max(minPerStat, Math.floor(stats.VI * defBand.viMult));
    const enCap = lotgEnemyEnCapFor(floor, !!boss, !!miniboss);
    if (stats.EN > enCap) stats.EN = enCap;
    const refund = Math.max(0, (enBefore - stats.EN) + (viBefore - stats.VI));
    if (refund > 0) {
      const redist = ["STG", "DX", "MA", "AG", "LUK"];
      for (let i = 0; i < refund; i++) stats[redist[i % redist.length]]++;
    }
    const lm = 1 + (level - 1) * 0.038;
    const hpTier = boss ? 1.34 : miniboss ? 1.22 : 1.05;
    let hpMax = Math.floor((40 + stats.HP * 11 + stats.VI * 6.5 + stats.EN * 4.5) * lm * danger * hpTier);
    if (!boss && !miniboss) hpMax = Math.floor(hpMax * 0.68);
    else if (miniboss) hpMax = Math.floor(hpMax * 0.88);
    const spMax = Math.floor((18 + stats.SP * 7 + stats.MA * 2) * lm);
    return {
      name: t.name,
      tag: t.tag,
      element: t.element || "Neutral",
      floor,
      boss: !!boss,
      miniboss: !!miniboss,
      level,
      stats,
      hpMax,
      hp: hpMax,
      spMax,
      spCur: spMax,
      ailments: emptyAilments(),
      statusSkillInternalCd: 0,
    };
  }

  function xpToNext(lv) {
    return 64 + lv * 36;
  }

  /** Umbral de XP para subir de nivel un recluta (más bajo que el doctor → suben un poco más rápido). */
  function unitXpThreshold(lv) {
    const l = lv != null && lv >= 1 ? lv : 1;
    return 42 + l * 19;
  }

  function lotgSave() {
    if (!lotgState) return;
    try {
      localStorage.setItem(STORAGE_LOTG, JSON.stringify(lotgState));
    } catch (e) {
      alert("No se pudo guardar (almacenamiento lleno o privado).");
    }
  }

  function lotgLoad() {
    try {
      let raw = localStorage.getItem(STORAGE_LOTG);
      if (!raw) {
        raw = localStorage.getItem(STORAGE_LOTG_LEGACY);
        if (raw) {
          try {
            localStorage.setItem(STORAGE_LOTG, raw);
            localStorage.removeItem(STORAGE_LOTG_LEGACY);
          } catch (e) {
            /* ignore */
          }
        }
      }
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s.gearStash) s.gearStash = [];
      if (!s.mapCellTypes) s.mapCellTypes = {};
      if (!Array.isArray(s.gachaLog)) s.gachaLog = [];
      if (!Array.isArray(s.inventory)) s.inventory = [];
      if (!s.lotgView) s.lotgView = "hub";
      normalizeSoulPointsOnState(s);
      migrateLotgState(s);
      if (!s.protag || typeof s.protag !== "object" || !s.protag.stats) return null;
      return s;
    } catch {
      return null;
    }
  }

  function lotgWipe() {
    clearCombatScene();
    try {
      localStorage.removeItem(STORAGE_LOTG_LEGACY);
      localStorage.removeItem(STORAGE_LOTG);
    } catch (e) {}
    lotgState = null;
  }

  function closeFloor20RewardOverlay() {
    const ov = document.getElementById("floor20RewardOverlay");
    if (ov) ov.style.display = "none";
  }

  function openFloor20RewardFlow() {
    const ov = document.getElementById("floor20RewardOverlay");
    const body = document.getElementById("floor20RewardBody");
    const actions = document.getElementById("floor20RewardActions");
    const title = document.getElementById("floor20RewardTitle");
    if (!ov || !body || !actions || !title) {
      alert("No se encontró la ventana de recompensa del piso 20.");
      return;
    }
    function renderPick() {
      title.textContent = "¡Felicidades por llegar tan lejos!";
      body.innerHTML =
        "<p>Has alcanzado y completado el <strong>piso 20</strong>. Has ganado tu recompensa: elige un <strong>equipamiento especial</strong> para que el GM te lo entregue en la campaña.</p>" +
        "<p class=\"muted\" style=\"margin-top:0.75rem\">Pulsa un set para leer su descripción y confirmar. Puedes cancelar y volver a esta lista.</p>";
      actions.innerHTML = "";
      FLOOR_20_REWARD_SETS.forEach((s) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "primary";
        b.style.margin = "0.25rem";
        b.textContent = s.label;
        b.addEventListener("click", () => renderConfirm(s));
        actions.appendChild(b);
      });
      const stay = document.createElement("button");
      stay.type = "button";
      stay.className = "ghost";
      stay.style.marginTop = "0.5rem";
      stay.textContent = "Cerrar y seguir en el piso 20";
      stay.addEventListener("click", () => closeFloor20RewardOverlay());
      actions.appendChild(stay);
      ov.style.display = "flex";
    }
    function renderConfirm(s) {
      title.textContent = "Confirmar set";
      body.innerHTML =
        "<p><strong>" +
        escapeHtml(s.label) +
        "</strong></p><p style=\"margin-top:0.75rem;line-height:1.5\">" +
        escapeHtml(s.desc) +
        "</p><p class=\"muted\" style=\"margin-top:0.75rem\">¿Seguro que quieres este set?</p>";
      actions.innerHTML = "";
      const ok = document.createElement("button");
      ok.type = "button";
      ok.className = "primary";
      ok.textContent = "Aceptar set";
      ok.addEventListener("click", () => {
        closeFloor20RewardOverlay();
        alert(
          "Manda una captura al GM del set que elegiste:\n«" +
            s.label +
            "»\n\n¡Gracias por participar! Tu partida guardada se borrará para que puedas crear un personaje nuevo desde cero."
        );
        const gw = document.getElementById("lotgGameWrap");
        if (gw) {
          gw.style.display = "none";
          gw.innerHTML = "";
        }
        lotgWipe();
        const introEl = document.getElementById("lotgIntro");
        if (introEl) introEl.style.display = "block";
        renderLotgCreate();
        playGlobalClinic();
      });
      const back = document.createElement("button");
      back.type = "button";
      back.className = "ghost";
      back.textContent = "Cancelar";
      back.addEventListener("click", () => renderPick());
      actions.appendChild(ok);
      actions.appendChild(back);
    }
    renderPick();
  }

  function randomZenReward(floor, streak, boss) {
    const st = streak || 0;
    const diff = floor * 2.2 + st * 1.4 + (boss ? 95 : 0);
    const base = 155 + Math.min(520, floor * 18) + Math.floor(diff * 2.4);
    return base + Math.floor(Math.random() * (140 + floor * 8 + Math.floor(st * 3)));
  }

  function soulRewardForVictory(floor, streak, wasBoss, wasMiniboss) {
    const st = streak || 0;
    const diff = floor * 2.4 + st * 1.35 + (wasBoss ? 52 : wasMiniboss ? 34 : 0);
    let n = 38 + Math.floor(diff * 0.72) + (wasBoss ? 48 : wasMiniboss ? 32 : 0);
    if (wasBoss) n += 400;
    else if (wasMiniboss) n += 420;
    else n += 310;
    return n;
  }

  function gachaCosts(premium) {
    const cost1 = premium ? 870 : 700;
    const cost10 = premium ? 2500 : 1600;
    return { cost1, cost10 };
  }

  function pickUnit(premium) {
    const promos = GACHA_UNITS.filter((u) => u.promo);
    const roll = Math.random() * 100;
    if (premium && roll < 1 && promos.length) {
      return promos[Math.floor(Math.random() * promos.length)];
    }
    const pool = GACHA_UNITS.filter((u) => !u.promo);
    const weights = pool.map((u) =>
      u.rarity === "SS" ? 3 : u.rarity === "S" ? 7 : u.rarity === "A" ? 20 : 38
    );
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[0];
  }

  /** Pesos por stat según rol del recluta (gacha). */
  function getRoleStatWeights(role) {
    const r = String(role || "");
    if (/Mágico|magico/i.test(r)) {
      return { HP: 2, SP: 4, STG: 1, DX: 2, VI: 2, MA: 5, EN: 2, AG: 2, LUK: 2 };
    }
    if (/Físico|Fisico/i.test(r)) {
      return { HP: 3, SP: 2, STG: 5, DX: 4, VI: 3, MA: 1, EN: 3, AG: 3, LUK: 2 };
    }
    if (/Healer|Sanador|Support heal/i.test(r)) {
      return { HP: 3, SP: 5, STG: 1, DX: 1, VI: 4, MA: 4, EN: 3, AG: 2, LUK: 2 };
    }
    /* Soporte y otros */
    return { HP: 2, SP: 4, STG: 1, DX: 2, VI: 3, MA: 3, EN: 3, AG: 4, LUK: 4 };
  }

  function distributeWeightedStatPoints(st, weights, points) {
    const wSum = STAT_KEYS.reduce((s, k) => s + (weights[k] || 1), 0);
    let left = points;
    while (left > 0) {
      let roll = Math.random() * wSum;
      for (let i = 0; i < STAT_KEYS.length; i++) {
        const k = STAT_KEYS[i];
        roll -= weights[k] || 1;
        if (roll <= 0) {
          st[k] = (st[k] || 0) + 1;
          left--;
          break;
        }
      }
    }
  }

  /** Stats iniciales: mínimo en todo + reparto aleatorio sesgado por rol y rareza (SSS > SS > S > A > B). */
  function rollRecruitBaseStats(template) {
    const weights = getRoleStatWeights(template.role);
    const rarity = template.rarity || "B";
    let minEach;
    let extraPool;
    if (rarity === "SSS") {
      minEach = 4;
      extraPool = 70;
    } else if (rarity === "SS") {
      minEach = 3;
      extraPool = 60;
    } else if (rarity === "S") {
      minEach = 3;
      extraPool = 52;
    } else if (rarity === "A") {
      minEach = 2;
      extraPool = 42;
    } else if (rarity === "B") {
      minEach = 2;
      extraPool = 34;
    } else {
      minEach = 2;
      extraPool = 24;
    }
    const st = emptyStats();
    STAT_KEYS.forEach((k) => {
      st[k] = minEach;
    });
    distributeWeightedStatPoints(st, weights, extraPool);
    return st;
  }

  function cloneUnit(template) {
    const st = rollRecruitBaseStats(template);
    const equipSlots = {};
    EQUIP_SLOTS.forEach((sl) => {
      equipSlots[sl] = null;
    });
    return {
      uid: "u-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      name: template.name,
      dupeKey: template.name,
      img: template.img,
      rarity: template.rarity,
      element: template.element || "Neutral",
      role: template.role,
      level: 1,
      xp: 0,
      mergeRank: 0,
      stats: st,
      skill: template.skill,
      passive: template.passive ? { name: template.passive.name, desc: template.passive.desc } : null,
      passiveHook: template.passiveHook || null,
      equipSlots,
    };
  }

  function addOrMergeUnit(template) {
    const key = template.name;
    const existing = lotgState.roster.find((u) => (u.dupeKey || u.name) === key);
    if (existing) {
      if (!existing.stats || typeof existing.stats !== "object") existing.stats = emptyStats();
      if ((existing.mergeRank || 0) < MAX_MERGE_RANK) {
        existing.mergeRank = (existing.mergeRank || 0) + 1;
        const rr = existing.rarity || "B";
        const mergePts =
          rr === "SSS" ? 24 : rr === "SS" ? 21 : rr === "S" ? 19 : rr === "A" ? 17 : 15;
        distributeWeightedStatPoints(existing.stats, getRoleStatWeights(existing.role), mergePts);
        return { merged: true, name: existing.name, rank: existing.mergeRank };
      }
      lotgState.zen += 150;
      return { refund: true, zen: 150 };
    }
    const nu = cloneUnit(template);
    nu.dupeKey = key;
    nu.mergeRank = 0;
    lotgState.roster.push(nu);
    return { merged: false, name: nu.name, rarity: nu.rarity };
  }

  /** Armas temáticas con bonificación extra si el nombre del portador contiene el substring (estilo «light cone» / arma firma). */
  const LOTG_UNIQUE_WEAPONS = [
    {
      eid: "uw-photon-lane",
      name: "Cañón de fotones — carril 7",
      equipSlot: "Arma",
      qual: "SS",
      bonus: { STG: 32, MA: 24, DX: 18, SP: 12 },
      urbanTag: true,
      uniqueBond: { match: "Kiyama", dmgBonus: 0.14 },
      bondDesc: "Si el portador lleva «Kiyama» en el nombre: +14% daño con armas y técnicas; aliados Fuego reciben +6% curación cuando curás desde el mapa.",
    },
    {
      eid: "uw-stellar-needle",
      name: "Aguja estelar — sutura orbital",
      equipSlot: "Arma",
      qual: "SS",
      bonus: { MA: 36, SP: 20, HP: 14, VI: 12, DX: 10 },
      urbanTag: true,
      uniqueBond: { match: "Hanazawa", dmgBonus: 0.12 },
      bondDesc: "Si el portador lleva «Hanazawa» en el nombre: +12% daño mágico; tus DoT aplican +1 ronda en combate LOTG.",
    },
    {
      eid: "uw-thunder-rail",
      name: "Riél trueno — metro fantasma",
      equipSlot: "Arma",
      qual: "S",
      bonus: { STG: 26, DX: 34, AG: 16, LUK: 8 },
      urbanTag: true,
      uniqueBond: { match: "Akamine", dmgBonus: 0.11 },
      bondDesc: "Si el portador lleva «Akamine» en el nombre: +11% daño físico; +4% probabilidad de crítico en ataques básicos.",
    },
    {
      eid: "uw-aonix-grua",
      name: "Módulo Aónix — grúa clínica (firma)",
      equipSlot: "Arma",
      qual: "SSS",
      bonus: { STG: 24, MA: 44, SP: 28, LUK: 14, DX: 12 },
      urbanTag: true,
      uniqueBond: { match: "Ceci", dmgBonus: 0.1 },
      bondDesc: "Pensado para el doctor protagonista si su nombre contiene «Ceci»: +10% daño mágico del técnica en área y +5% SP máx. efectivo en combate.",
    },
  ];

  function randomEquipItem(premium) {
    const r = Math.random();
    let qual;
    if (premium) {
      qual = r < 0.04 ? "SSS" : r < 0.22 ? "SS" : r < 0.66 ? "S" : "A";
    } else {
      qual = r < 0.02 ? "SS" : r < 0.35 ? "S" : "A";
    }
    const urban = {
      Cabeza: [
        "Visor de interferencia (Bangboo mod.)",
        "Casco de ánodo callejero",
        "Máscara HIA — sello urbano",
        "Gafas térmicas de contenedor",
      ],
      Cuerpo: [
        "Chaleco laminar — ruta 6",
        "Mono de extracción Hollow",
        "Traje antiestático de metro sellado",
        "Capa de cable reciclado",
      ],
      Arma: [
        "Cadena eléctrica portátil",
        "Pistola de clavos médicos",
        "Vara de contención cívica",
        "Sierra circular de obra (mod. W-Engine)",
      ],
      Accesorio: [
        "Amuleto de Zen corrupto",
        "Detector de Ether residual",
        "Broche de facción sin nombre",
        "Llavero de torniquete fantasma",
      ],
    };
    const equipSlot = EQUIP_SLOTS[Math.floor(Math.random() * EQUIP_SLOTS.length)];
    const pool = urban[equipSlot];
    const baseName = pool[Math.floor(Math.random() * pool.length)];
    const qMul = qual === "SSS" ? 3.6 : qual === "SS" ? 2.65 : qual === "S" ? 1.78 : 1.18;
    const rr = Math.random();
    let weaponArchetype = "phys";
    if (rr < 0.33) weaponArchetype = "phys";
    else if (rr < 0.66) weaponArchetype = "firearm";
    else weaponArchetype = "mag";
    const roll = (v) => Math.max(1, Math.floor(v * qMul * (0.92 + Math.random() * 0.22)));
    let bonus;
    if (equipSlot === "Arma") {
      if (weaponArchetype === "phys") {
        bonus = { STG: roll(14), DX: roll(6), MA: roll(4), AG: roll(3), LUK: roll(2) };
      } else if (weaponArchetype === "firearm") {
        bonus = { DX: roll(14), STG: roll(7), MA: roll(4), AG: roll(4), LUK: roll(3) };
      } else {
        bonus = { MA: roll(14), SP: roll(8), DX: roll(5), STG: roll(4), LUK: roll(3) };
      }
    } else if (equipSlot === "Cuerpo") {
      bonus = { HP: roll(16), VI: roll(12), EN: roll(11), STG: roll(4), MA: roll(4), SP: roll(4) };
    } else if (equipSlot === "Cabeza") {
      bonus = { HP: roll(11), VI: roll(9), EN: roll(8), AG: roll(4), LUK: roll(4), SP: roll(3) };
    } else {
      bonus = { AG: roll(10), LUK: roll(10), MA: roll(5), STG: roll(5), SP: roll(4), DX: roll(4) };
    }
    let specialAffix = null;
    if (equipSlot === "Accesorio") {
      const af = Math.random();
      if (af < 0.22) specialAffix = { type: "soul_gain", pct: 0.14, label: "Afinidad álmica: +14% Soul al ganar combate" };
      else if (af < 0.42) specialAffix = { type: "zen_gain", pct: 0.14, label: "Mercado gris: +14% Zen al ganar combate" };
      else if (af < 0.58) specialAffix = { type: "xp_gain", pct: 0.12, label: "Tutor holográfico: +12% EXP de combate" };
      else if (af < 0.76) {
        const st = Math.random() < 0.5 ? "STG" : "DX";
        specialAffix = {
          type: "stat_synergy",
          stat: st,
          threshold: 155,
          pct: 0.12,
          scope: st === "DX" ? "firearm" : "phys",
          label: "Sinergia " + st + " 155+: +12% daño " + (st === "DX" ? "de armas de fuego" : "físico"),
        };
      } else {
        specialAffix = {
          type: "stat_synergy",
          stat: "MA",
          threshold: 150,
          pct: 0.12,
          scope: "mag",
          label: "Sinergia MA 150+: +12% daño mágico",
        };
      }
    }
    const archetypeTag = equipSlot === "Arma" ? (weaponArchetype === "mag" ? "arcano" : weaponArchetype === "firearm" ? "fuego" : "físico") : null;
    return {
      eid: "eq-" + Date.now(),
      name: baseName + " [" + qual + "]",
      equipSlot,
      qual,
      bonus,
      weaponArchetype: archetypeTag,
      specialAffix,
      urbanTag: true,
    };
  }

  function renderLotgCreate() {
    const w = document.getElementById("lotgCreateWrap");
    if (!w) return;
    w.innerHTML = `
      <h3>Crear protagonista</h3>
      <p class="muted">Distribuye <strong>50</strong> puntos en stats. Elige género y avatar predeterminado (Lawliet / LawlietG) o sube una imagen.</p>
      <form id="lotgCreateForm">
        <label>Nombre</label>
        <input type="text" name="pname" required placeholder="Dr. …" />
        <label>Género (lore)</label>
        <select name="gender"><option value="M">Masculino</option><option value="F">Femenino</option><option value="X">Otro / NB</option></select>
        <label>Avatar predeterminado</label>
        <select name="preset">
          <option value="lawliet" selected>Lawliet (Char/Lawliet.png)</option>
          <option value="lawlietg">LawlietG (Char/LawlietG.png)</option>
          <option value="">— Solo imagen propia (sin preset) —</option>
        </select>
        <label>Imagen propia (opcional)</label>
        <input type="file" name="avatar" accept="image/*" />
        <div class="lotg-stats-create" id="lotgStatInputs"></div>
        <p class="muted" id="lotgPointsLeft"></p>
        <button type="submit" class="primary">Comenzar run</button>
        <button type="button" class="ghost" id="btnLoadLotg" style="margin-left:8px">Cargar partida</button>
        <button type="button" class="ghost danger" id="btnWipeLotgSave" style="margin-left:8px">Borrar partida guardada</button>
      </form>`;
    const statWrap = document.getElementById("lotgStatInputs");
    const ptsEl = document.getElementById("lotgPointsLeft");
    const inputs = {};
    STAT_KEYS.forEach((k) => {
      const d = document.createElement("div");
      d.innerHTML = `<label>${k}</label><input type="number" min="0" max="50" value="5" name="st_${k}" />`;
      statWrap.appendChild(d);
      inputs[k] = d.querySelector("input");
    });
    const BUDGET = 50;
    function refreshPts() {
      let used = 0;
      STAT_KEYS.forEach((k) => (used += parseInt(inputs[k].value, 10) || 0));
      ptsEl.textContent = "Puntos restantes: " + (BUDGET - used) + " / " + BUDGET;
      ptsEl.style.color = used === BUDGET ? "var(--success)" : used > BUDGET ? "var(--danger)" : "var(--muted)";
    }
    STAT_KEYS.forEach((k) => inputs[k].addEventListener("input", refreshPts));
    refreshPts();

    const btnLoadLotg = document.getElementById("btnLoadLotg");
    if (btnLoadLotg) {
      btnLoadLotg.addEventListener("click", () => {
      const s = lotgLoad();
      if (!s) return alert("No hay partida guardada.");
      clearCombatScene();
      lotgState = s;
      document.getElementById("lotgIntro").style.display = "none";
      document.getElementById("lotgGameWrap").style.display = "block";
      playLotgTrack("safe", "Safe Area");
      renderLotgGame();
    });
    }

    const btnWipeLotgSave = document.getElementById("btnWipeLotgSave");
    if (btnWipeLotgSave) {
      btnWipeLotgSave.addEventListener("click", () => {
        if (!confirm("¿Borrar la partida guardada en este navegador? No se puede deshacer.")) return;
        lotgWipe();
        const gameWrap = document.getElementById("lotgGameWrap");
        if (gameWrap) {
          gameWrap.innerHTML = "";
          gameWrap.style.display = "none";
        }
        const introEl = document.getElementById("lotgIntro");
        if (introEl) introEl.style.display = "block";
        renderLotgCreate();
        alert("Guardado borrado. Puedes crear un personaje de nuevo.");
      });
    }

    const lotgCreateForm = document.getElementById("lotgCreateForm");
    if (lotgCreateForm) {
      lotgCreateForm.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const f = ev.target;
      const stats = emptyStats();
      let used = 0;
      STAT_KEYS.forEach((k) => {
        const v = parseInt(f["st_" + k].value, 10) || 0;
        stats[k] = v;
        used += v;
      });
      if (used !== 50) {
        alert("Debes repartir exactamente 50 puntos.");
        return;
      }
      const pdata = {
        name: f.pname.value.trim(),
        gender: f.gender.value,
        avatarPreset: f.preset.value,
        stats,
        avatarDataUrl: null,
      };
      const file = f.avatar.files[0];
      const start = () => {
        if (!pdata.avatarDataUrl && (!pdata.avatarPreset || pdata.avatarPreset === "")) {
          alert("Sube una imagen o elige Lawliet / LawlietG como avatar.");
          return;
        }
        lotgWipe();
        lotgState = {
          floor: 1,
          zen: 0,
          soul: INITIAL_SOUL,
          lotgView: "hub",
          protag: createLotgCharacter(pdata),
          roster: [],
          partyUids: [],
          inventory: [],
          gearStash: [],
          equipSlots: { Cabeza: null, Cuerpo: null, Arma: null, Accesorio: null },
          mapRevealed: {},
          mapCellTypes: {},
          mapCellDone: {},
          mapCellMeta: {},
          mapBossCellKey: null,
          mapFloorForExitCoord: -1,
          mapExitCoord: null,
          floorConditionForFloor: 0,
          floorAdvanceRule: "free",
          floorBossCleared: true,
          floorExitKey: true,
          floorRelicFound: true,
          mapPos: "2,2",
          combatsCleared: 0,
          storyChoiceLog: [],
          gachaLog: [],
          shopPurchaseLog: [],
          runCombatAtkMult: 1,
          runCombatAtkFights: 0,
          combatBuff: { atkMult: 1, turns: 0 },
          partyVitalsPersist: {},
          mapLayoutFloor: null,
          ownedSkillIds: [],
          equippedSkillsProtag: [],
          socialLinks: {},
          activeSideQuests: [],
          completedQuestIds: [],
          shopSoulPurchases: 0,
          giftInventory: {},
        };
        const cs = protagCombatStats(lotgState.protag);
        lotgState.protag.hpCur = cs.hpMax;
        lotgState.protag.spCur = cs.spMax;
        document.getElementById("lotgIntro").style.display = "none";
        document.getElementById("lotgGameWrap").style.display = "block";
        playLotgTrack("safe", "Safe Area");
        renderLotgGame();
        lotgSave();
      };
      if (file) {
        const r = new FileReader();
        r.onload = () => {
          pdata.avatarDataUrl = r.result;
          start();
        };
        r.readAsDataURL(file);
      } else start();
    });
    }
  }

  function applyEquipToProtag() {
    if (!lotgState || !lotgState.protag || !lotgState.protag.stats) {
      return { hpMax: 120, spMax: 60, atkP: 12, atkM: 10, def: 8, agi: 10 };
    }
    migrateLotgState(lotgState);
    const p = lotgState.protag;
    const merged = mergeStatsWithEquipSlots(p.stats || {}, lotgState.equipSlots || {});
    const base = protagCombatStats({ ...p, stats: merged });
    const ab = allyBonusFromParty();
    const wpn = equipWeaponDamageMultiplier(lotgState.equipSlots || {}, lotgState.protag);
    const pb = sumLotgEquippedPassivesProtag();
    const hpM = 1 + ab.hp + (pb.hpPct || 0);
    const atkM1 = (1 + ab.atk) * wpn * (1 + (pb.physDmgPct || 0));
    const atkM2 = (1 + ab.atk) * wpn * (1 + (pb.magDmgPct || 0));
    const defM = (1 + ab.def) * (1 + (pb.defFlat || 0));
    return {
      hpMax: Math.floor(base.hpMax * hpM),
      spMax: Math.floor(base.spMax * (1 + ab.hp * 0.12 + (pb.hpPct || 0) * 0.5)),
      atkP: Math.floor(base.atkP * atkM1),
      atkM: Math.floor(base.atkM * atkM2),
      def: Math.floor(base.def * defM),
      agi: base.agi,
    };
  }

  function vnFormatStoryText(s) {
    if (s == null) return "";
    return escapeHtml(String(s)).replace(/\n/g, "<br/>");
  }

  function resetVNChrome() {
    const port = document.getElementById("vnPortrait");
    const ch = document.getElementById("vnChoices");
    const cont = document.getElementById("vnContinue");
    if (port) {
      port.style.display = "none";
      port.innerHTML = "";
    }
    if (ch) {
      ch.style.display = "none";
      ch.innerHTML = "";
    }
    if (cont) cont.style.display = "";
  }

  function showVN(beat, onDone) {
    const ov = document.getElementById("vnOverlay");
    const txt = document.getElementById("vnText");
    const port = document.getElementById("vnPortrait");
    resetVNChrome();
    const bg = VN_BG[beat.bg % VN_BG.length];
    ov.style.backgroundImage = `linear-gradient(180deg,rgba(0,0,0,.55),rgba(0,0,0,.85)), url("${bg}")`;
    let body = vnFormatStoryText(beat.text);
    if (beat.speaker) {
      const expr =
        beat.expression != null && String(beat.expression).trim() !== ""
          ? ` <span class="muted vn-expression">(${escapeHtml(String(beat.expression).trim())})</span>`
          : "";
      body = `<strong class="vn-speaker">${escapeHtml(beat.speaker)}</strong>${expr}<br/><br/>` + body;
    }
    txt.innerHTML = `<strong>${escapeHtml(beat.title)}</strong><br/><br/>${body}`;
    if (beat.portrait && port) {
      port.style.display = "block";
      port.innerHTML = `<img src="${escapeAttrUrl(beat.portrait)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:10px" onerror="this.parentElement.style.display='none'"/>`;
    }
    playStoryMood(beat.vnMood || "calm");
    ov.classList.add("show");
    const cont = document.getElementById("vnContinue");
    const close = () => {
      ov.classList.remove("show");
      cont.onclick = null;
      resetVNChrome();
      /* No volver a «Safe Area» entre páginas: solo el callback final (salida del capítulo) pone música del hub. */
      onDone && onDone();
    };
    cont.onclick = close;
  }

  function showVNSequenceFromBeat(beat, onDone) {
    const pages = beat.pages || [];
    if (!pages.length) {
      showVN(beat, onDone);
      return;
    }
    let i = 0;
    function next() {
      if (i >= pages.length) {
        onDone && onDone();
        return;
      }
      const pg = pages[i++];
      const mood = pg.vnMood != null ? pg.vnMood : beat.vnMood != null ? beat.vnMood : "calm";
      showVN(
        {
          title: pg.title || beat.title,
          text: pg.text,
          bg: pg.bg != null ? pg.bg : beat.bg,
          vnMood: mood,
          speaker: pg.speaker,
          expression: pg.expression,
          portrait: pg.portrait,
        },
        next
      );
    }
    next();
  }

  function runChoiceAllyChapter(ch, onDone) {
    const roster = lotgState.roster || [];
    if (roster.length < (ch.requiresRosterMin || 1)) {
      alert("Necesitas al menos un recluta en tu roster para esta escena.");
      onDone && onDone();
      return;
    }
    const partnerName = ch.partnerUnitName || "Aozora Lin";
    const tmpl = GACHA_UNITS.find((g) => g.name === partnerName);
    const rosterUnit = roster.find((u) => u.name === partnerName);
    const imgSrc = (tmpl && tmpl.img) || (rosterUnit && rosterUnit.img) || "Char/Lawliet.png";
    const displayName = partnerName;

    function openChoicesOverlay() {
      const ov = document.getElementById("vnOverlay");
      const txt = document.getElementById("vnText");
      const port = document.getElementById("vnPortrait");
      const choicesEl = document.getElementById("vnChoices");
      const cont = document.getElementById("vnContinue");
      resetVNChrome();
      const bg = VN_BG[ch.bg % VN_BG.length];
      ov.style.backgroundImage = `linear-gradient(180deg,rgba(0,0,0,.55),rgba(0,0,0,.85)), url("${bg}")`;
      port.style.display = "block";
      port.innerHTML = `<img src="${escapeAttrUrl(imgSrc)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:10px" onerror="this.style.display='none'"/>`;
      txt.innerHTML = `<strong>${escapeHtml(ch.title)}</strong><br/><br/>
      <strong class="vn-speaker">${escapeHtml(displayName)}</strong> <span class="muted vn-expression">(postura tensa, dedos en el guantelete como si midiera un cable invisible)</span><br/><br/>
      Te intercepta en un pasillo que <em>no</em> estaba en el mapa que te dieron en recepción. El aire huele a ozono barato y a café frío; sus ojos, claros bajo el flequillo, llevan el brillo de quien ha contado demasiados segundos entre un latido y el siguiente.<br/><br/>
      —Doctor… no voy a pedirte que seas valiente. Solo que no me mientas con la voz de <em>protocolo</em>. ¿Esto es un desastre urbano para el parte, o podemos hablar como adultos que ya oyeron el zumbido?`;
      choicesEl.style.display = "flex";
      cont.style.display = "none";
      /* La música ya viene del último beat del interludio; solo subimos tensión si antes estaba en calma/serio. */
      playStoryMood("tension");
      ov.classList.add("show");

      const opts = [
        {
          id: "calma",
          label: "Calma clínica: datos, riesgos y siguiente paso (sin teatro).",
          reaction:
            displayName +
            " exhala por la nariz, casi una risa sin humor. ‘Bien. Eso es lo que necesito: que me trates como instrumento bien calibrado, no como damisela en apuros.’ Afloja los dedos; el hombro deja de estar encajado como un candado.— Doctor, cuando digas ‘avanzamos’, avanzo. No antes. No después.",
        },
        {
          id: "empatia",
          label: "Empatía sincera: nombras el miedo sin quitarle peso al deber.",
          reaction:
            displayName +
            " parpadea demasiado rápido, una vez, dos. Luego asiente con la barbilla alta, como si aceptara un trato vergonzoso pero justo.— …Gracias. Odio que me funcione eso. La mayoría solo grita órdenes con voz de trueno falso. Tú… —traga— …escuchas como quien toma lecturas. No voy a olvidarlo.",
        },
        {
          id: "firme",
          label: "Frialdad operativa: necesitas obediencia inmediata en zona caliente.",
          reaction:
            displayName +
            " te mira un segundo de más, el brillo frío de quien aprendió a no discutir con el cable equivocado.— Entendido. Modo herramienta. —Su voz baja un tono, afilada.— Cuando esto pase, recordaré quién me pidió silencio útil y quién me pidió alma. Por ahora: orden recibida.",
        },
      ];

      function finishChoice(choiceId, reactionHtml) {
        playStoryMood(choiceId === "firme" ? "serious" : "calm");
        choicesEl.style.display = "none";
        choicesEl.innerHTML = "";
        txt.innerHTML += `<br/><br/><em>${vnFormatStoryText(reactionHtml)}</em>`;
        if (!lotgState.storyChoiceLog) lotgState.storyChoiceLog = [];
        lotgState.storyChoiceLog.push({
          chapter: ch.id,
          unit: displayName,
          choice: choiceId,
          t: Date.now(),
        });
        cont.style.display = "";
        cont.onclick = () => {
          ov.classList.remove("show");
          cont.onclick = null;
          resetVNChrome();
          playLotgTrack("safe", "Safe Area");
          resetVnStoryMusicState();
          lotgSave();
          onDone && onDone();
        };
      }

      opts.forEach((o) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = o.label;
        b.addEventListener("click", () => finishChoice(o.id, o.reaction));
        choicesEl.appendChild(b);
      });
    }

    if (ch.pages && ch.pages.length) {
      showVNSequenceFromBeat(
        { title: ch.title, bg: ch.bg, vnMood: ch.vnMood || "calm", pages: ch.pages },
        openChoicesOverlay
      );
    } else openChoicesOverlay();
  }

  function gearSellPrice(eq) {
    const q = eq && eq.qual;
    const add = q === "SSS" ? 320 : q === "SS" ? 180 : q === "S" ? 80 : 35;
    return 60 + add;
  }

  function applyEquipPieceFromStashToTarget(stashIdx, destKey) {
    if (!lotgState) {
      alert("El inventario de piezas del minijuego solo se usa dentro de «Legend of the Gathering» (inicia o carga una partida). El catálogo Patimon de arriba es independiente.");
      return false;
    }
    const st = lotgState.gearStash || [];
    const piece = st[stashIdx];
    if (!piece) return false;
    const sl = piece.equipSlot && EQUIP_SLOTS.includes(piece.equipSlot) ? piece.equipSlot : "Cuerpo";
    migrateLotgState(lotgState);
    if (destKey === "protag") {
      if (lotgState.equipSlots[sl]) {
        alert("Doctor " + lotgState.protag.name + ": la ranura " + sl + " está ocupada. Quítala primero.");
        return false;
      }
      st.splice(stashIdx, 1);
      lotgState.equipSlots[sl] = piece;
      return true;
    }
    const u = (lotgState.roster || []).find((x) => x.uid === destKey);
    if (!u) return false;
    if (u.equipSlots[sl]) {
      alert(u.name + ": la ranura " + sl + " está ocupada. Quítala primero.");
      return false;
    }
    st.splice(stashIdx, 1);
    u.equipSlots[sl] = piece;
    return true;
  }

  function pushShopPurchaseLog(line) {
    if (!lotgState.shopPurchaseLog) lotgState.shopPurchaseLog = [];
    const t = new Date().toLocaleString();
    lotgState.shopPurchaseLog.unshift("[" + t + "] " + line);
    if (lotgState.shopPurchaseLog.length > 40) lotgState.shopPurchaseLog.length = 40;
  }

  const LOTG_SIDE_QUEST_TEMPLATES = [
    {
      id: "sq_kill6",
      title: "Cazar anomalías menores",
      desc: "Derrota a 6 enemigos en combates del mapa (acumulativo).",
      kind: "kills",
      need: 6,
      reward: { zen: 280, soul: 55 },
    },
    {
      id: "sq_kill12",
      title: "Limpieza profunda del sector",
      desc: "Elimina 12 enemigos en total en esta run.",
      kind: "kills",
      need: 12,
      reward: { zen: 420, soul: 120 },
    },
    {
      id: "sq_floor5",
      title: "Reconocimiento inferior",
      desc: "Alcanza el piso 5 o superior.",
      kind: "floor",
      need: 5,
      reward: { zen: 350, soul: 70 },
    },
    {
      id: "sq_boss1",
      title: "Prueba de valor",
      desc: "Derrota a 1 jefe de piso (casilla 💀).",
      kind: "boss",
      need: 1,
      reward: { zen: 500, soul: 150 },
    },
  ];

  const LOTG_GIFT_CATALOG = [
    { id: "gf_choco", name: "Caja de chocolates del nudo", tags: ["sweet", "cute"], price: 120 },
    { id: "gf_book", name: "Novela de ciencia-ficción usada", tags: ["calm", "smart"], price: 95 },
    { id: "gf_flower", name: "Ramo de flores de neón", tags: ["romantic", "cute"], price: 140 },
    { id: "gf_game", name: "Cartucho retro importado", tags: ["playful", "smart"], price: 200 },
    { id: "gf_tea", name: "Té medicinal premium", tags: ["calm", "sweet"], price: 110 },
    { id: "gf_chain", name: "Colgante de cable pulido", tags: ["cool", "edgy"], price: 165 },
  ];

  function runQuestNpcCell(cellKey) {
    if (!lotgState) return "";
    migrateLotgState(lotgState);
    const active = lotgState.activeSideQuests || [];
    const taken = new Set(active.map((q) => q.tid));
    const pool = LOTG_SIDE_QUEST_TEMPLATES.filter((t) => !taken.has(t.id));
    if (!pool.length) {
      lotgState.mapCellDone[cellKey] = true;
      return "El informante ya no tiene encargos nuevos por ahora. Vuelve en otro piso.";
    }
    const t = pool[Math.floor(Math.random() * pool.length)];
    const ok = confirm(
      "NPC del sector — misión secundaria\n\n«" +
        t.title +
        "»\n\n" +
        t.desc +
        "\n\nRecompensa aproximada: Zen y Soul Points.\n\n¿Aceptas?"
    );
    if (!ok) return "Prefieres no comprometerte. La casilla queda sin completar; puedes volver.";
    active.push({ tid: t.id, title: t.title, kind: t.kind, need: t.need, prog: 0, reward: t.reward });
    lotgState.activeSideQuests = active;
    lotgState.mapCellDone[cellKey] = true;
    lotgSave();
    return "Misión aceptada. Abre «Vínculos y misiones» en el menú superior para ver el progreso y entregarla al completarla.";
  }

  function lotgRollGiftShopStock() {
    const a = LOTG_GIFT_CATALOG.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a.slice(0, 4);
  }

  function lotgRollSkillShopOffer() {
    const pool = LOTG_BATTLE_SKILLS.filter((x) => x && x.id);
    const pickN = (arr, n, out, ex) => {
      const sh = arr.slice();
      for (let i = sh.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = sh[i];
        sh[i] = sh[j];
        sh[j] = t;
      }
      for (let i = 0; i < sh.length && out.length < n; i++) {
        if (!ex.has(sh[i].id)) {
          ex.add(sh[i].id);
          out.push(sh[i]);
        }
      }
    };
    const ex = new Set();
    const out = [];
    pickN(
      pool.filter((s) => s.rarity === "SSS" || s.rarity === "SS"),
      1,
      out,
      ex
    );
    pickN(pool.filter((s) => s.rarity === "S"), 1, out, ex);
    pickN(pool.filter((s) => s.rarity === "A"), 2, out, ex);
    pickN(pool.filter((s) => s.rarity === "B"), 2, out, ex);
    pickN(pool, 6 - out.length, out, ex);
    return out.slice(0, 6);
  }

  function buildRotatingItemShopStock() {
    const roll = Date.now();
    const healPool = [
      { healPct: 0.32, price: 155, name: "Spray coagulante HIA", desc: "≈32% HP máx. en combate o mapa." },
      { healPct: 0.42, price: 205, name: "Kit médico de campo (HIA)", desc: "≈42% HP máx." },
      { healPct: 0.52, price: 268, name: "Bolsa de suero de calle 12", desc: "≈52% HP máx." },
    ];
    const spPool = [
      { spPct: 0.3, price: 148, name: "Célula de éter (débil)", desc: "≈30% SP máx." },
      { spPct: 0.42, price: 198, name: "Célula de éter comprimido", desc: "≈42% SP máx." },
      { spPct: 0.55, price: 255, name: "Ampolla de maná urbano", desc: "≈55% SP máx." },
    ];
    const pick = (arr, n) => {
      const x = arr.slice();
      for (let i = x.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = x[i];
        x[i] = x[j];
        x[j] = t;
      }
      return x.slice(0, n);
    };
    const stock = [];
    pick(healPool, 2).forEach((h, i) => {
      stock.push({
        id: "h-" + roll + "-" + i,
        name: h.name,
        detail: h.desc,
        price: h.price,
        heal: true,
        healPct: h.healPct,
        invName: h.name,
      });
    });
    pick(spPool, 2).forEach((h, i) => {
      stock.push({
        id: "s-" + roll + "-" + i,
        name: h.name,
        detail: h.desc,
        price: h.price,
        spItem: true,
        spPct: h.spPct,
        invName: h.name,
      });
    });
    const buffRoll = Math.random();
    stock.push({
      id: "b-" + roll,
      name: buffRoll < 0.5 ? "Inyector de Ether inestable" : "Modulador de daño Mk.II",
      detail: buffRoll < 0.5 ? "+12% daño, 6 turnos propios" : "+16% daño, 4 turnos propios",
      price: buffRoll < 0.5 ? 238 : 265,
      buffConsumable: true,
      atkPct: buffRoll < 0.5 ? 0.12 : 0.16,
      turns: buffRoll < 0.5 ? 6 : 4,
    });
    stock.push({
      id: "c-" + roll,
      name: "Neutralizador de estados (lote)",
      detail: "Cura silencio, sueño, parálisis, quemadura y congelación en combate.",
      price: 228,
      cleanseItem: true,
    });
    stock.push({
      id: "st-" + roll,
      name: "Tónico de reacción (+AGI)",
      detail: "+9% daño infligido durante 5 turnos propios del doctor.",
      price: 252,
      statItem: true,
      statBuffPct: 0.09,
      statTurns: 5,
    });
    for (let g = 0; g < 3; g++) {
      const eq =
        g === 0 && Math.random() < 0.22
          ? LOTG_UNIQUE_WEAPONS[Math.floor(Math.random() * LOTG_UNIQUE_WEAPONS.length)]
          : randomEquipItem();
      const bondLine = eq.uniqueBond && eq.bondDesc ? " · " + eq.bondDesc : "";
      stock.push({
        id: "g-" + roll + "-" + g,
        name: eq.name + " (oferta)",
        detail: (eq.equipSlot || "?") + " · " + formatEquipBonusLine(eq) + bondLine,
        price: 320 + Math.floor(Math.random() * 220) + (eq.qual === "S" ? 80 : 0) + (eq.qual === "SS" ? 260 : 0) + (eq.qual === "SSS" ? 520 : 0),
        gearObj: eq,
      });
    }
    const sc = lotgState.shopSoulPurchases || 0;
    stock.push({
      id: "soul-" + roll,
      name: "Residuo de alma comprimido",
      detail: "+80 Soul Points (el precio sube cada compra en esta run).",
      price: 395 + sc * 88,
      soul: 80,
    });
    return stock;
  }

  function openGiftShop(mapCellKey) {
    const ov = document.getElementById("anomalyShopOverlay");
    const body = document.getElementById("shopBody");
    const title = document.getElementById("shopTitle");
    const desc = document.getElementById("shopDesc");
    if (!ov || !body || !lotgState) return;
    if (title) title.textContent = "Boutique de regalos";
    if (desc) desc.textContent = "Objetos para el modo Vínculos. El surtido cambia al entrar.";
    if (mapCellKey) lotgState._shopFromCellKey = mapCellKey;
    const gifts = lotgRollGiftShopStock();
    function render() {
      let html = "<p><strong>Regalos</strong> — Zen: <strong>" + lotgState.zen + "</strong></p><ul style='list-style:none;padding:0'>";
      gifts.forEach((g) => {
        html += `<li style="margin:0.5rem 0;padding:0.5rem;border-radius:10px;border:1px solid rgba(255,80,120,0.25)">
          <div style="font-weight:600">${escapeHtml(g.name)}</div>
          <div class="muted" style="font-size:0.76rem">${escapeHtml(g.tags.join(", "))}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.35rem">
            <strong>${g.price} Z</strong>
            <button type="button" class="ghost shop-gift-buy" data-gift-id="${escapeHtml(g.id)}">Comprar</button>
          </div></li>`;
      });
      html += "</ul>";
      body.innerHTML = html;
      body.querySelectorAll(".shop-gift-buy").forEach((btn) => {
        btn.addEventListener("click", () => {
          const gid = btn.getAttribute("data-gift-id");
          const it = gifts.find((x) => x.id === gid);
          if (!it || lotgState.zen < it.price) {
            alert("No tienes suficiente Zen.");
            return;
          }
          lotgState.zen -= it.price;
          if (!lotgState.giftInventory || typeof lotgState.giftInventory !== "object") lotgState.giftInventory = {};
          lotgState.giftInventory[it.id] = (lotgState.giftInventory[it.id] || 0) + 1;
          pushShopPurchaseLog("Regalo: " + it.name + " · −" + it.price + " Z");
          lotgSave();
          render();
        });
      });
    }
    render();
    ov.style.display = "flex";
    const close = () => {
      ov.style.display = "none";
      document.getElementById("shopClose").onclick = null;
      if (lotgState._shopFromCellKey) {
        lotgState.mapCellDone[lotgState._shopFromCellKey] = true;
        lotgState._shopFromCellKey = null;
        lotgSave();
        renderLotgGame();
      }
    };
    document.getElementById("shopClose").onclick = close;
  }

  function openSkillSoulShop(mapCellKey) {
    const ov = document.getElementById("anomalyShopOverlay");
    const body = document.getElementById("shopBody");
    const title = document.getElementById("shopTitle");
    const desc = document.getElementById("shopDesc");
    if (!ov || !body || !lotgState) return;
    if (title) title.textContent = "Tienda de técnicas (Soul)";
    if (desc)
      desc.textContent =
        "6 técnicas distintas por visita (mezcla de rarezas). Precios altos en S/SS/SSS y suben un poco con cada compra en la run. Equipa máx. 4 por personaje.";
    if (mapCellKey) lotgState._shopFromCellKey = mapCellKey;
    normalizeSoulPointsOnState(lotgState);
    const offers = lotgRollSkillShopOffer();
    function render() {
      const sp = lotgState.soul;
      let html = "<p><strong>Soul Points:</strong> " + sp + "</p><ul style='list-style:none;padding:0'>";
      offers.forEach((sk) => {
        const own = (lotgState.ownedSkillIds || []).includes(sk.id);
        const price = lotgSkillShopPrice(sk);
        html += `<li style="margin:0.55rem 0;padding:0.5rem;border-radius:10px;border:1px solid rgba(255,105,180,0.35);background:rgba(80,20,60,0.2)">
          <div style="font-weight:600">${escapeHtml(sk.name)} <span class="slot-equip-tag">${escapeHtml(sk.rarity)}</span></div>
          <div class="muted" style="font-size:0.76rem;margin:0.25rem 0;line-height:1.4">${escapeHtml(sk.desc)}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.35rem">
            <span><strong>${price}</strong> SP</span>
            <button type="button" class="ghost shop-skill-buy" data-skill-id="${escapeHtml(sk.id)}" ${own ? "disabled" : ""}>${own ? "Ya en colección" : "Comprar"}</button>
          </div></li>`;
      });
      html += "</ul>";
      body.innerHTML = html;
      body.querySelectorAll(".shop-skill-buy").forEach((btn) => {
        if (btn.disabled) return;
        btn.addEventListener("click", () => {
          const sid = btn.getAttribute("data-skill-id");
          const sk = getLotgBattleSkill(sid);
          if (!sk) return;
          normalizeSoulPointsOnState(lotgState);
          const price = lotgSkillShopPrice(sk);
          if (lotgState.soul < price) {
            alert("No tienes suficientes Soul Points.");
            return;
          }
          lotgState.soul -= price;
          if (!Array.isArray(lotgState.ownedSkillIds)) lotgState.ownedSkillIds = [];
          if (!lotgState.ownedSkillIds.includes(sk.id)) lotgState.ownedSkillIds.push(sk.id);
          pushShopPurchaseLog("Técnica: " + sk.name + " · −" + price + " SP");
          lotgSave();
          render();
        });
      });
    }
    render();
    ov.style.display = "flex";
    const close = () => {
      ov.style.display = "none";
      document.getElementById("shopClose").onclick = null;
      if (lotgState._shopFromCellKey) {
        lotgState.mapCellDone[lotgState._shopFromCellKey] = true;
        lotgState._shopFromCellKey = null;
        lotgSave();
        renderLotgGame();
      }
    };
    document.getElementById("shopClose").onclick = close;
  }

  function tryForgeWeaponOnProtag() {
    if (!lotgState || !lotgState.equipSlots) return "Sin estado.";
    const w = lotgState.equipSlots.Arma;
    if (!w) return "Equipa un arma en la ranura Arma del doctor para forjar.";
    migrateLotgState(lotgState);
    const cur = w.forgePlus != null ? Math.min(10, Math.max(0, Math.floor(w.forgePlus))) : 0;
    if (cur >= 10) return "El arma ya está en +10.";
    const cost = 70 + cur * 48;
    normalizeSoulPointsOnState(lotgState);
    if (lotgState.soul < cost) return "Necesitas " + cost + " Soul Points para este intento.";
    lotgState.soul -= cost;
    const failP = Math.min(0.62, 0.12 + cur * 0.055);
    const roll = Math.random();
    if (roll < failP) {
      if (Math.random() < 0.38 && cur > 0) {
        w.forgePlus = cur - 1;
        pushShopPurchaseLog("Forja fallida crítica: arma " + (cur - 1) + "+.");
        lotgSave();
        return "¡La forja retrocede! Tu arma baja a +" + w.forgePlus + ".";
      }
      pushShopPurchaseLog("Forja fallida (sin pérdida de nivel).");
      lotgSave();
      return "La forja chispea pero no avanza. Pierdes el Soul de este intento.";
    }
    w.forgePlus = cur + 1;
    pushShopPurchaseLog("Forja exitosa: arma +" + w.forgePlus + ".");
    lotgSave();
    return "¡Éxito! Arma ahora +" + w.forgePlus + ". Daño de arma mejorado.";
  }

  function openItemShop(mapCellKey) {
    const ov = document.getElementById("anomalyShopOverlay");
    const body = document.getElementById("shopBody");
    const title = document.getElementById("shopTitle");
    const desc = document.getElementById("shopDesc");
    if (!ov || !body || !lotgState) return;
    if (title) title.textContent = "Tienda ambulante (rotativa)";
    if (desc) desc.textContent = "El surtido y precios de Soul cambian al entrar. Forja el arma equipada del doctor con Soul.";
    if (mapCellKey) lotgState._shopFromCellKey = mapCellKey;
    const stock = buildRotatingItemShopStock();
    function render() {
      const wNow = lotgState.equipSlots && lotgState.equipSlots.Arma;
      const forgeLv = wNow && wNow.forgePlus != null ? Math.min(10, Math.max(0, Math.floor(wNow.forgePlus))) : 0;
      const forgeCost = 70 + forgeLv * 48;
      let html = "<p><strong>Zen:</strong> " + lotgState.zen + " · <strong>Soul:</strong> " + getSoulPoints() + "</p>";
      html += "<ul style='list-style:none;padding:0;margin:0.5rem 0 1rem'>";
      stock.forEach((it) => {
        html += `<li style="margin:0.55rem 0;padding:0.5rem;border-radius:10px;border:1px solid rgba(255,255,255,0.08)">
          <div style="font-weight:600">${escapeHtml(it.name)}</div>
          <div class="muted" style="font-size:0.78rem;margin:0.2rem 0">${escapeHtml(it.detail || "")}</div>
          <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0.5rem;margin-top:0.35rem">
            <span><strong>${it.price}</strong> Z</span>
            <button type="button" class="ghost shop-buy" data-shop-id="${escapeHtml(it.id)}" style="font-size:0.85rem">Comprar</button>
          </div>
        </li>`;
      });
      html += "</ul>";
      html +=
        "<div style='margin:1rem 0;padding:0.75rem;border-radius:10px;border:1px solid rgba(250,204,21,0.35);background:rgba(40,35,10,0.35)'>" +
        "<strong>Forja de arma</strong> (ranura <em>Arma</em> del doctor)<br/>" +
        "<span class='muted' style='font-size:0.78rem'>Nivel actual: +" +
        forgeLv +
        "/10 · Próximo intento: <strong>" +
        forgeCost +
        "</strong> Soul · riesgo de fallo sube con el nivel.</span><br/>" +
        "<button type='button' class='primary shop-forge' style='margin-top:0.5rem'>Intentar forjar (+1)</button></div>";
      const log = lotgState.shopPurchaseLog || [];
      html +=
        "<p class='muted' style='font-size:0.78rem;margin:0 0 0.5rem'><strong>Últimas compras</strong></p><ul style='font-size:0.72rem;margin:0;padding-left:1rem;max-height:80px;overflow:auto'>" +
        (log.length ? log.map((l) => "<li>" + escapeHtml(l) + "</li>").join("") : "<li class='muted'>—</li>") +
        "</ul>";
      const stash = lotgState.gearStash || [];
      if (stash.length) {
        html += "<p><strong>Vender</strong> almacén</p><ul style='list-style:none;padding:0'>";
        stash.forEach((eq, idx) => {
          const sell = gearSellPrice(eq);
          const bl = formatEquipBonusLine(eq);
          html += `<li style="margin:0.5rem 0;display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:space-between;align-items:center">
            <span>${escapeHtml(eq.name)} <span class='slot-equip-tag'>[${escapeHtml(eq.equipSlot || "?")}]</span>${bl ? " · <span class='muted'>" + escapeHtml(bl) + "</span>" : ""} → <strong>${sell}</strong> Z</span>
            <button type="button" class="ghost shop-sell" data-sell-idx="${idx}" style="font-size:0.85rem">Vender</button>
          </li>`;
        });
        html += "</ul>";
      } else html += "<p class='muted'>Sin piezas en almacén.</p>";
      body.innerHTML = html;
      const forgeBtn = body.querySelector(".shop-forge");
      if (forgeBtn) {
        forgeBtn.addEventListener("click", () => {
          alert(tryForgeWeaponOnProtag());
          render();
        });
      }
      body.querySelectorAll(".shop-buy").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-shop-id");
          const it = stock.find((x) => x.id === id);
          if (!it || lotgState.zen < it.price) {
            alert("No tienes suficiente Zen.");
            return;
          }
          const zenBefore = lotgState.zen;
          lotgState.zen -= it.price;
          const stamp = new Date().toLocaleString();
          if (it.heal) {
            lotgState.inventory.push({
              type: "heal",
              name: it.invName || it.name,
              healPct: it.healPct != null ? it.healPct : 0.35,
              desc: it.detail || "",
            });
            pushShopPurchaseLog("Compra: " + it.name + " · −" + (zenBefore - lotgState.zen) + " Z · " + stamp);
          }
          if (it.soul) {
            normalizeSoulPointsOnState(lotgState);
            lotgState.soul += it.soul;
            lotgState.shopSoulPurchases = (lotgState.shopSoulPurchases || 0) + 1;
            pushShopPurchaseLog("Compra: " + it.name + " · −" + (zenBefore - lotgState.zen) + " Z · +" + it.soul + " SP · " + stamp);
          }
          if (it.buffConsumable) {
            lotgState.inventory.push({
              type: "buff",
              name: it.name,
              atkPct: it.atkPct != null ? it.atkPct : 0.12,
              turns: it.turns != null ? it.turns : 4,
              desc: it.detail || "",
            });
            pushShopPurchaseLog("Compra: " + it.name + " · −" + (zenBefore - lotgState.zen) + " Z · " + stamp);
          }
          if (it.cleanseItem) {
            lotgState.inventory.push({
              type: "cleanse",
              name: it.name,
              desc: it.detail || "Limpia estados alterados.",
            });
            pushShopPurchaseLog("Compra: " + it.name + " · −" + (zenBefore - lotgState.zen) + " Z · " + stamp);
          }
          if (it.statItem) {
            lotgState.inventory.push({
              type: "stat",
              name: it.name,
              statBuffPct: it.statBuffPct != null ? it.statBuffPct : 0.08,
              turns: it.statTurns != null ? it.statTurns : 5,
              desc: it.detail || "",
            });
            pushShopPurchaseLog("Compra: " + it.name + " · −" + (zenBefore - lotgState.zen) + " Z · " + stamp);
          }
          if (it.gearObj) {
            const g = JSON.parse(JSON.stringify(it.gearObj));
            g.eid = "shop-" + Date.now();
            if (!lotgState.gearStash) lotgState.gearStash = [];
            lotgState.gearStash.push(g);
            pushShopPurchaseLog(
              "Compra: " + g.name + " [" + g.equipSlot + "] · " + formatEquipBonusLine(g) + " · −" + (zenBefore - lotgState.zen) + " Z · " + stamp
            );
          }
          lotgSave();
          render();
        });
      });
      body.querySelectorAll(".shop-sell").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.getAttribute("data-sell-idx"), 10);
          const st = lotgState.gearStash || [];
          const eq = st[idx];
          if (!eq) return;
          const sell = gearSellPrice(eq);
          lotgState.zen += sell;
          st.splice(idx, 1);
          pushShopPurchaseLog("Venta: " + eq.name + " · +" + sell + " Z · " + new Date().toLocaleString());
          lotgSave();
          render();
        });
      });
    }
    render();
    ov.style.display = "flex";
    const close = () => {
      ov.style.display = "none";
      document.getElementById("shopClose").onclick = null;
      if (lotgState._shopFromCellKey) {
        lotgState.mapCellDone[lotgState._shopFromCellKey] = true;
        lotgState._shopFromCellKey = null;
        lotgSave();
        renderLotgGame();
      }
    };
    document.getElementById("shopClose").onclick = close;
  }

  function startCombat() {
    combatPickMode = null;
    combatEnemies = [];
    const isBoss = !!(lotgState && lotgState._combatIsBoss);
    const isMini = !!(lotgState && lotgState._combatIsMiniboss);
    if (lotgState) {
      lotgState._combatIsBoss = false;
      lotgState._combatIsMiniboss = false;
    }
    if (isBoss) {
      combatEnemies.push(scaleEnemy(lotgState.floor, true));
    } else if (isMini) {
      combatEnemies.push(scaleEnemy(lotgState.floor, false, { miniboss: true }));
    } else {
      const pack = 2 + (Math.random() < 0.52 ? 1 : 0);
      for (let i = 0; i < pack; i++) combatEnemies.push(scaleEnemy(lotgState.floor, false));
    }
    combatLog = [];
    skillCdPro = 0;
    combatPhase = "player";
    combatAllyIndex = 0;
    lotgState.combatAllyVitals = {};
    if (!lotgState.partyVitalsPersist) lotgState.partyVitalsPersist = {};
    getPartyUnits().forEach((u) => {
      const st = allyCombatStats(u);
      const pv = lotgState.partyVitalsPersist[u.uid];
      let hp = st.hpMax;
      let sp = st.spMax;
      if (pv && typeof pv.hp === "number" && typeof pv.sp === "number" && Number.isFinite(pv.hp) && Number.isFinite(pv.sp)) {
        hp = Math.max(0, Math.min(st.hpMax, Math.floor(pv.hp)));
        sp = Math.max(0, Math.min(st.spMax, Math.floor(pv.sp)));
      }
      lotgState.combatAllyVitals[u.uid] = {
        hp,
        sp,
        skillCd: 0,
        consumableBuffMult: 1,
        consumableBuffTurns: 0,
        extraSkillCd: {},
        battleMods: { physPct: 0, magPct: 0, turns: 0 },
        ailments: emptyAilments(),
      };
    });
    lotgState.protagExtraSkillCd = {};
    lotgState.protagBattleMods = { physPct: 0, magPct: 0, turns: 0 };
    lotgState.combatGuardBuff = { pct: 0, turns: 0 };
    lotgState.protagAilments = emptyAilments();
    const stg = lotgState.stagingAllyItemBuff;
    if (stg && stg.uid && lotgState.combatAllyVitals[stg.uid]) {
      const v0 = lotgState.combatAllyVitals[stg.uid];
      v0.consumableBuffMult = stg.mult > 0 ? stg.mult : 1;
      v0.consumableBuffTurns = stg.turns > 0 ? stg.turns : 4;
      lotgState.stagingAllyItemBuff = null;
    }
    lotgState.combatBuff = { atkMult: 1, turns: 0 };
    if (lotgState.runCombatAtkFights > 0) {
      lotgState.runCombatAtkFights--;
      const m = lotgState.runCombatAtkMult > 1 ? lotgState.runCombatAtkMult : 1.14;
      lotgState.combatBuff = { atkMult: m, turns: 99 };
      combatLog.push("Efecto de evento: +" + Math.round((m - 1) * 100) + "% daño en esta batalla.");
    }
    getPartyUnits().forEach((u) => {
      if (u.passiveHook === "doctorSp15") {
        const p = lotgState.protag;
        const cs = applyEquipToProtag();
        p.spCur = Math.min(cs.spMax, p.spCur + 15);
        combatLog.push("Pasiva — " + u.name + ": +15 SP al doctor.");
      }
    });
    if (isBoss) {
      playLotgTrack("boss", "Battle of OTA");
    } else if (isMini) {
      playLotgTrack("miniboss", "Dungeon Lv4");
    } else {
      const useNervo = ((lotgState.combatsCleared || 0) % 2 === 0);
      if (useNervo) playLotgTrack("nervous", "Nervo");
      else playLotgTrack("dungeonV1", "Dungeon V1");
    }
    const bg = COMBAT_BG[Math.floor(Math.random() * COMBAT_BG.length)];
    renderLotgGame({ combatBg: bg });
  }

  function endCombat(win) {
    const nKilled = combatEnemies.filter((e) => e).length;
    const wasBoss = combatEnemies.some((e) => e && e.boss);
    const wasMiniboss = combatEnemies.some((e) => e && e.miniboss);
    if (win && lotgState) snapshotPartyVitalsToPersist();
    if (lotgState && lotgState.combatAllyVitals) delete lotgState.combatAllyVitals;
    combatPhase = "player";
    combatAllyIndex = 0;
    combatEnemies = [];
    if (win) {
      if (lotgState._pendingMapCellKey) {
        if (!lotgState.mapCellDone) lotgState.mapCellDone = {};
        lotgState.mapCellDone[lotgState._pendingMapCellKey] = true;
        lotgState._pendingMapCellKey = null;
      }
      const streak = lotgState.combatsCleared || 0;
      const econ = lotgEconomyBonusFromAccessories();
      const zenBase = randomZenReward(lotgState.floor, streak, wasBoss || wasMiniboss);
      const zen = Math.floor(zenBase * (1 + (econ.zenPct || 0)));
      lotgState.zen += zen;
      const soulBase = soulRewardForVictory(lotgState.floor, streak, wasBoss, wasMiniboss);
      const soul = Math.floor(soulBase * (1 + (econ.soulPct || 0)));
      normalizeSoulPointsOnState(lotgState);
      lotgState.soul += soul;
      const xpBase = 48 + lotgState.floor * 14 + Math.floor(streak * 1.1);
      const xpGain = Math.floor(xpBase * (1 + (econ.xpPct || 0)));
      combatLog.push("Victoria: +" + zen + " Zen, +" + soul + " Soul Points, +" + xpGain + " EXP.");
      gainXpProtagonist(xpGain);
      getPartyUnits().forEach((u) => gainXpUnit(u, Math.floor(xpGain * 0.72)));
      if (wasBoss) lotgState.floorBossCleared = true;
      lotgState.combatsCleared++;
      if (Array.isArray(lotgState.activeSideQuests)) {
        lotgState.activeSideQuests.forEach((q) => {
          if (q.kind === "kills") q.prog = Math.min(q.need, (q.prog || 0) + nKilled);
          if (q.kind === "boss" && wasBoss) q.prog = Math.min(q.need, (q.prog || 0) + 1);
        });
      }
    } else {
      if (lotgState) lotgState._pendingMapCellKey = null;
      lotgWipe();
      alert("Has caído. La anomalía reclama la run: se pierde progreso, Zen, Soul, unidades y equipo. Vuelves a la pantalla inicial.");
      const gw = document.getElementById("lotgGameWrap");
      if (gw) {
        gw.style.display = "none";
        gw.innerHTML = "";
      }
      document.getElementById("lotgIntro").style.display = "block";
      renderLotgCreate();
      playGlobalClinic();
      return;
    }
    if (lotgState) {
      lotgState.combatBuff = { atkMult: 1, turns: 0 };
      lotgState.combatGuardBuff = { pct: 0, turns: 0 };
    }
    playLotgTrack("safe", "Safe Area");
    renderLotgGame();
  }

  function gainXpProtagonist(amt) {
    const p = lotgState.protag;
    p.xp += amt;
    let need = xpToNext(p.level);
    while (p.xp >= need) {
      p.xp -= need;
      p.level++;
      p.statPoints += 5;
      need = xpToNext(p.level);
    }
  }

  function gainXpUnit(u, amt) {
    if (!u.stats || typeof u.stats !== "object") u.stats = emptyStats();
    if (u.xp == null || !Number.isFinite(u.xp)) u.xp = 0;
    u.xp += amt;
    let need = unitXpThreshold(u.level);
    while (u.xp >= need) {
      u.xp -= need;
      u.level++;
      const gain = 8 + Math.min(6, Math.floor(u.level / 5));
      distributeWeightedStatPoints(u.stats, getRoleStatWeights(u.role), gain);
      need = unitXpThreshold(u.level);
    }
  }

  /** Reservado para efectos que deban dispararse al confirmar una acción (los buffs de equipo bajan en la oleada enemiga). */
  function tickCombatRoundStart() {}

  /**
   * Fin de oleada enemiga: CD de técnicas nativas y equipadas, buff de equipo, consumibles de aliados,
   * modos de combate del doctor/aliados y vulnerabilidades en enemigos — todo en la misma escala de «rondas».
   */
  function lotgTickGlobalCooldownsAfterEnemyWave() {
    if (!lotgState || !inLotgCombat()) return;
    if (skillCdPro > 0) skillCdPro--;
    if (lotgState.combatAllyVitals) {
      getPartyUnits().forEach((u) => {
        const v = lotgState.combatAllyVitals[u.uid];
        if (v && v.skillCd > 0) v.skillCd--;
      });
    }
    if (lotgState.protag && lotgState.protag.passive) {
      const cs = applyEquipToProtag();
      lotgState.protag.spCur = Math.min(cs.spMax, lotgState.protag.spCur + 2);
    }
    if (lotgState.protagExtraSkillCd && typeof lotgState.protagExtraSkillCd === "object") {
      Object.keys(lotgState.protagExtraSkillCd).forEach((k) => {
        const n = lotgState.protagExtraSkillCd[k] || 0;
        if (n > 0) lotgState.protagExtraSkillCd[k] = n - 1;
      });
    }
    if (lotgState.combatAllyVitals) {
      getPartyUnits().forEach((u) => {
        const v = lotgState.combatAllyVitals[u.uid];
        if (!v || !v.extraSkillCd) return;
        Object.keys(v.extraSkillCd).forEach((k) => {
          const n = v.extraSkillCd[k] || 0;
          if (n > 0) v.extraSkillCd[k] = n - 1;
        });
      });
    }
    if (lotgState.combatBuff && lotgState.combatBuff.turns > 0) {
      lotgState.combatBuff.turns--;
      if (lotgState.combatBuff.turns <= 0) lotgState.combatBuff.atkMult = 1;
    }
    getPartyUnits().forEach((u) => {
      const v = lotgState.combatAllyVitals && lotgState.combatAllyVitals[u.uid];
      if (!v) return;
      const bt = v.consumableBuffTurns || 0;
      if (bt > 0) {
        v.consumableBuffTurns = bt - 1;
        if (v.consumableBuffTurns <= 0) v.consumableBuffMult = 1;
      }
      if (v.battleMods && (v.battleMods.turns || 0) > 0) {
        v.battleMods.turns--;
        if (v.battleMods.turns <= 0) {
          v.battleMods.physPct = 0;
          v.battleMods.magPct = 0;
        }
      }
    });
    if (lotgState.protagBattleMods && (lotgState.protagBattleMods.turns || 0) > 0) {
      lotgState.protagBattleMods.turns--;
      if (lotgState.protagBattleMods.turns <= 0) {
        lotgState.protagBattleMods.physPct = 0;
        lotgState.protagBattleMods.magPct = 0;
      }
    }
    combatEnemies.forEach((en) => {
      if (!en || en.hp <= 0) return;
      if (en.lotgVulnerable && (en.lotgVulnerable.turns || 0) > 0) {
        en.lotgVulnerable.turns--;
        if (en.lotgVulnerable.turns <= 0) delete en.lotgVulnerable;
      }
      if (en.lotgEnemyDebuff && (en.lotgEnemyDebuff.turns || 0) > 0) {
        en.lotgEnemyDebuff.turns--;
        if (en.lotgEnemyDebuff.turns <= 0) delete en.lotgEnemyDebuff;
      }
      if (en.lotgOutDamageDebuff && (en.lotgOutDamageDebuff.turns || 0) > 0) {
        en.lotgOutDamageDebuff.turns--;
        if (en.lotgOutDamageDebuff.turns <= 0) delete en.lotgOutDamageDebuff;
      }
    });
    if (lotgState.combatGuardBuff && (lotgState.combatGuardBuff.turns || 0) > 0) {
      lotgState.combatGuardBuff.turns--;
      if (lotgState.combatGuardBuff.turns <= 0) delete lotgState.combatGuardBuff;
    }
  }

  function clearTargetAilments(tk) {
    const z = emptyAilments();
    if (tk === "protag") {
      lotgState.protagAilments = z;
      return;
    }
    const v = lotgState.combatAllyVitals && lotgState.combatAllyVitals[tk];
    if (v) v.ailments = z;
  }

  function allyBattleStancePhys(vitals) {
    if (!vitals || !vitals.battleMods || (vitals.battleMods.turns || 0) <= 0) return 1;
    return 1 + (vitals.battleMods.physPct || 0);
  }

  function allyBattleStanceMag(vitals) {
    if (!vitals || !vitals.battleMods || (vitals.battleMods.turns || 0) <= 0) return 1;
    return 1 + (vitals.battleMods.magPct || 0);
  }

  function applyLotgEquippedSkill(skillId, whoUid, enemyIdx, allyKey) {
    const sk = getLotgBattleSkill(skillId);
    const p = lotgState.protag;
    const cs = applyEquipToProtag();
    if (!sk || !sk.combat || sk.combat.kind === "passive") return { ok: false, log: "Técnica inválida." };
    const c = sk.combat;
    const isPro = whoUid === "protag";
    const u = !isPro ? getPartyUnits().find((x) => x.uid === whoUid) : null;
    const vitals = !isPro && u ? lotgState.combatAllyVitals[u.uid] : null;
    if (!isPro && (!u || !vitals || vitals.hp <= 0)) return { ok: false, log: "Unidad no disponible." };
    if (isPro) {
      if (!lotgState.protagExtraSkillCd || typeof lotgState.protagExtraSkillCd !== "object") lotgState.protagExtraSkillCd = {};
    } else {
      if (!vitals.extraSkillCd) vitals.extraSkillCd = {};
      if (!vitals.battleMods) vitals.battleMods = { physPct: 0, magPct: 0, turns: 0 };
    }
    const cdMap = isPro ? lotgState.protagExtraSkillCd : vitals.extraSkillCd;
    const cdLeft = cdMap[skillId] || 0;
    if (cdLeft > 0) {
      return { ok: false, log: "«" + sk.name + "» en enfriamiento (" + cdLeft + " ronda(s) enemiga(s))." };
    }
    const cost = c.sp || 0;
    if (isPro) {
      if (p.spCur < cost) return { ok: false, log: "SP insuficiente para «" + sk.name + "»." };
    } else if (vitals.sp < cost) return { ok: false, log: u.name + " sin SP para «" + sk.name + "»." };
    const cdSet = Math.max(0, Math.floor(Number(c.cd)));
    function cdNote() {
      return cdSet > 0 ? " Enfriamiento: " + cdSet + " ronda(s) enemiga(s)." : "";
    }
    const atkZone = lotgState.anomalyBuffFloor === lotgState.floor && lotgState.anomalyBuffAmt ? 1 + lotgState.anomalyBuffAmt : 1;
    const cb = lotgState.combatBuff && lotgState.combatBuff.turns > 0 ? lotgState.combatBuff.atkMult || 1 : 1;
    const allyM = !isPro ? atkZone * allyConsumableBuffMult(vitals) * 1.1 : 1;
    const pd = getProtagDerivedDefense();

    function payCost() {
      if (isPro) {
        p.spCur -= cost;
        if (cdSet > 0) lotgState.protagExtraSkillCd[skillId] = cdSet;
        else delete lotgState.protagExtraSkillCd[skillId];
      } else {
        vitals.sp -= cost;
        if (cdSet > 0) vitals.extraSkillCd[skillId] = cdSet;
        else delete vitals.extraSkillCd[skillId];
      }
    }

    if (c.kind === "dmg_mag_aoe") {
      payCost();
      const alive = combatEnemies.filter((e) => e.hp > 0);
      const parts = [];
      const coef = c.coef || 0.85;
      alive.forEach((en) => {
        const raw = isPro
          ? lotgProtagMagicalRaw(cs, atkZone, cb, coef * 1.02)
          : allyCombatStats(u).atkM * coef * allyM * allyBattleStanceMag(vitals) * (0.95 + Math.random() * 0.25);
        const sp = alive.length > 1 ? 0.62 : 1;
        let dmg = damageToEnemyMagical(raw * sp, en);
        const el = sk.element || (isPro ? p.lotgElement : u.element) || "Neutral";
        dmg = Math.floor(dmg * elementalDamageMult(el, en.element || "Neutral"));
        dmg = Math.max(1, dmg);
        en.hp -= dmg;
        parts.push(en.name + " −" + dmg);
      });
      return { ok: true, log: (isPro ? p.name : u.name) + ": «" + sk.name + "» — " + parts.join(", ") + "." + cdNote() };
    }
    if (c.kind === "dmg_mag_1") {
      const en = combatEnemies[enemyIdx];
      if (!en || en.hp <= 0) return { ok: false, log: "Sin objetivo." };
      payCost();
      const coef = c.coef || 1.5;
      const raw = isPro
        ? lotgProtagMagicalRaw(cs, atkZone, cb, coef * 0.98)
        : allyCombatStats(u).atkM * coef * allyM * allyBattleStanceMag(vitals) * (0.98 + Math.random() * 0.22);
      let dmg = damageToEnemyMagical(raw, en);
      const el = sk.element || (isPro ? p.lotgElement : u.element) || "Neutral";
      dmg = Math.floor(dmg * elementalDamageMult(el, en.element || "Neutral"));
      if (Math.random() < pd.crit * 0.85) dmg = Math.floor(dmg * 1.42);
      dmg = Math.max(1, dmg);
      en.hp -= dmg;
      return { ok: true, log: (isPro ? p.name : u.name) + ": «" + sk.name + "» — " + en.name + " −" + dmg + "." + cdNote() };
    }
    if (c.kind === "dmg_phys_1") {
      const en = combatEnemies[enemyIdx];
      if (!en || en.hp <= 0) return { ok: false, log: "Sin objetivo." };
      payCost();
      const coef = c.coef || 1.5;
      const raw = isPro
        ? lotgProtagPhysicalRaw(cs, atkZone, cb) * coef * 0.62
        : allyCombatStats(u).atkP * coef * allyM * allyBattleStancePhys(vitals) * (0.96 + Math.random() * 0.24);
      let dmg = damageToEnemyPhysical(raw, en);
      dmg = Math.floor(dmg * elementalDamageMult(isPro ? p.lotgElement : u.element || "Neutral", en.element || "Neutral"));
      dmg = Math.max(1, dmg);
      en.hp -= dmg;
      return { ok: true, log: (isPro ? p.name : u.name) + ": «" + sk.name + "» — " + en.name + " −" + dmg + "." + cdNote() };
    }
    if (c.kind === "dmg_firearm_1") {
      const en = combatEnemies[enemyIdx];
      if (!en || en.hp <= 0) return { ok: false, log: "Sin objetivo." };
      payCost();
      const coef = c.coef || 1.45;
      const raw = isPro
        ? lotgProtagFirearmRaw(cs, atkZone, cb, coef)
        : allyFirearmRaw(u, vitals, allyM, coef);
      let dmg = damageToEnemyPhysical(raw, en);
      const el = sk.element || (isPro ? p.lotgElement : u.element) || "Neutral";
      dmg = Math.floor(dmg * elementalDamageMult(el, en.element || "Neutral"));
      if (Math.random() < (isPro ? pd.crit : critChanceFromStats(mergeStatsWithEquipSlots((u && u.stats) || {}, (u && u.equipSlots) || {}))) * 0.86) {
        dmg = Math.floor(dmg * 1.46);
      }
      dmg = Math.max(1, dmg);
      en.hp -= dmg;
      return { ok: true, log: (isPro ? p.name : u.name) + ": «" + sk.name + "» — disparo a " + en.name + " por " + dmg + "." + cdNote() };
    }
    if (c.kind === "heal_all") {
      payCost();
      const pct = c.healPct || 0.18;
      p.hpCur = Math.min(cs.hpMax, p.hpCur + Math.floor(cs.hpMax * pct));
      getPartyUnits().forEach((al) => {
        const v2 = lotgState.combatAllyVitals[al.uid];
        if (!v2 || v2.hp <= 0) return;
        const am = allyCombatStats(al);
        v2.hp = Math.min(am.hpMax, v2.hp + Math.floor(am.hpMax * pct));
      });
      return { ok: true, log: "«" + sk.name + "» — sanación grupal." + cdNote() };
    }
    if (c.kind === "heal_1") {
      payCost();
      const pct = c.healPct || 0.2;
      const tk = allyKey === "protag" ? "protag" : allyKey;
      if (tk === "protag") {
        p.hpCur = Math.min(cs.hpMax, p.hpCur + Math.floor(cs.hpMax * pct));
      } else {
        const al = getPartyUnits().find((x) => x.uid === tk);
        const v2 = al && lotgState.combatAllyVitals[al.uid];
        const am = allyCombatStats(al);
        if (!v2 || v2.hp <= 0) return { ok: false, log: "Objetivo inválido." };
        v2.hp = Math.min(am.hpMax, v2.hp + Math.floor(am.hpMax * pct));
      }
      return { ok: true, log: "«" + sk.name + "» — curación focal." + cdNote() };
    }
    if (c.kind === "buff_team") {
      payCost();
      if (!lotgState.combatBuff) lotgState.combatBuff = { atkMult: 1, turns: 0 };
      const bm = 1 + (c.buffPct || 0.1);
      lotgState.combatBuff.atkMult = Math.max(lotgState.combatBuff.atkMult || 1, bm);
      lotgState.combatBuff.turns = Math.max(lotgState.combatBuff.turns || 0, c.buffTurns || 4);
      return {
        ok: true,
        log:
          "«" +
          sk.name +
          "» — refuerzo de equipo +" +
          Math.round((c.buffPct || 0.1) * 100) +
          "% daño (" +
          (c.buffTurns || 4) +
          " ronda(s) enemiga(s))." +
          cdNote(),
      };
    }
    if (c.kind === "cleanse_1") {
      payCost();
      const tk = allyKey === "protag" ? "protag" : allyKey;
      clearTargetAilments(tk);
      return { ok: true, log: "«" + sk.name + "» — estados limpiados." + cdNote() };
    }
    if (c.kind === "dot_aoe") {
      payCost();
      const alive = combatEnemies.filter((e) => e.hp > 0);
      alive.forEach((en) => {
        const raw = isPro
          ? lotgProtagMagicalRaw(cs, atkZone, cb, (c.coef || 0.5) * 0.9)
          : allyCombatStats(u).atkM * (c.coef || 0.5) * allyM * allyBattleStanceMag(vitals);
        let dmg = damageToEnemyMagical(raw * 0.65, en);
        dmg = Math.floor(dmg * elementalDamageMult(sk.element || "Fuego", en.element || "Neutral"));
        dmg = Math.max(1, dmg);
        en.hp -= dmg;
        const dotD = Math.max(2, Math.floor(en.hpMax * (c.dotHpPct || 0.045)));
        en.lotgDotDmg = dotD;
        en.lotgDotTurns = Math.max(en.lotgDotTurns || 0, c.dotTurns || 3);
      });
      return { ok: true, log: "«" + sk.name + "» — impacto + DoT en horda." + cdNote() };
    }
    if (c.kind === "dot_main") {
      const en = combatEnemies[enemyIdx];
      if (!en || en.hp <= 0) return { ok: false, log: "Sin objetivo." };
      payCost();
      const raw = isPro
        ? lotgProtagMagicalRaw(cs, atkZone, cb, (c.coef || 0.85) * 0.9)
        : allyCombatStats(u).atkM * (c.coef || 0.85) * allyM * allyBattleStanceMag(vitals);
      let dmg = damageToEnemyMagical(raw, en);
      dmg = Math.max(1, dmg);
      en.hp -= dmg;
      en.lotgDotDmg = Math.max(2, Math.floor(en.hpMax * (c.dotHpPct || 0.04)));
      en.lotgDotTurns = c.dotTurns || 3;
      return { ok: true, log: "«" + sk.name + "» — " + en.name + " marcado con DoT." + cdNote() };
    }
    if (c.kind === "status_enemy_1") {
      const en = combatEnemies[enemyIdx];
      if (!en || en.hp <= 0) return { ok: false, log: "Sin objetivo." };
      payCost();
      const coef = c.coef || 0.4;
      const raw = isPro
        ? lotgProtagMagicalRaw(cs, atkZone, cb, coef * 0.88)
        : allyCombatStats(u).atkM * coef * allyM * allyBattleStanceMag(vitals) * (0.96 + Math.random() * 0.22);
      let dmg = damageToEnemyMagical(raw, en);
      const el = sk.element || (isPro ? p.lotgElement : u.element) || "Neutral";
      dmg = Math.floor(dmg * elementalDamageMult(el, en.element || "Neutral"));
      dmg = Math.max(1, dmg);
      en.hp -= dmg;
      applyAilmentToEnemy(en, c.ailment, c.duration || 3);
      const lab = LOTG_AILMENT_LABELS[c.ailment] || c.ailment;
      return {
        ok: true,
        log:
          (isPro ? p.name : u.name) +
          ": «" +
          sk.name +
          "» — " +
          en.name +
          " −" +
          dmg +
          "; " +
          lab +
          " (" +
          (c.duration || 3) +
          " rondas enemigas)." +
          cdNote(),
      };
    }
    if (c.kind === "status_enemy_aoe") {
      payCost();
      const alive = combatEnemies.filter((e) => e.hp > 0);
      const parts = [];
      const dur = c.duration || 3;
      const coef = c.coef || 0.35;
      alive.forEach((en) => {
        const raw = isPro
          ? lotgProtagMagicalRaw(cs, atkZone, cb, coef * 0.94)
          : allyCombatStats(u).atkM * coef * allyM * allyBattleStanceMag(vitals) * (0.94 + Math.random() * 0.2);
        const sp = alive.length > 1 ? 0.62 : 1;
        let dmg = damageToEnemyMagical(raw * sp, en);
        const el = sk.element || (isPro ? p.lotgElement : u.element) || "Neutral";
        dmg = Math.floor(dmg * elementalDamageMult(el, en.element || "Neutral"));
        dmg = Math.max(1, dmg);
        en.hp -= dmg;
        const aff = Math.random() < 0.5 ? "burn" : "para";
        applyAilmentToEnemy(en, aff, dur);
        parts.push(en.name + " −" + dmg + " (" + LOTG_AILMENT_LABELS[aff] + ")");
      });
      return { ok: true, log: (isPro ? p.name : u.name) + ": «" + sk.name + "» — " + parts.join(", ") + "." + cdNote() };
    }
    if (c.kind === "phys_double_1") {
      const en = combatEnemies[enemyIdx];
      if (!en || en.hp <= 0) return { ok: false, log: "Sin objetivo." };
      payCost();
      const c1 = c.coef1 != null ? c.coef1 : 0.9;
      const c2 = c.coef2 != null ? c.coef2 : 0.72;
      const raw1 = isPro
        ? lotgProtagPhysicalRaw(cs, atkZone, cb) * c1 * 0.58
        : allyCombatStats(u).atkP * c1 * allyM * allyBattleStancePhys(vitals) * (0.95 + Math.random() * 0.2);
      const raw2 = isPro
        ? lotgProtagPhysicalRaw(cs, atkZone, cb) * c2 * 0.58
        : allyCombatStats(u).atkP * c2 * allyM * allyBattleStancePhys(vitals) * (0.92 + Math.random() * 0.22);
      const el = isPro ? p.lotgElement : u.element || "Neutral";
      let d1 = damageToEnemyPhysical(raw1, en);
      d1 = Math.floor(d1 * elementalDamageMult(el, en.element || "Neutral"));
      en.hp -= Math.max(1, d1);
      let d2 = damageToEnemyPhysical(raw2, en);
      d2 = Math.floor(d2 * elementalDamageMult(el, en.element || "Neutral"));
      en.hp -= Math.max(1, d2);
      return {
        ok: true,
        log: (isPro ? p.name : u.name) + ": «" + sk.name + "» — " + en.name + " −" + d1 + " / −" + d2 + "." + cdNote(),
      };
    }
    if (c.kind === "debuff_vuln_1") {
      const en = combatEnemies[enemyIdx];
      if (!en || en.hp <= 0) return { ok: false, log: "Sin objetivo." };
      payCost();
      const coef = c.coef || 0.55;
      const raw = isPro
        ? lotgProtagMagicalRaw(cs, atkZone, cb, coef * 0.92)
        : allyCombatStats(u).atkM * coef * allyM * allyBattleStanceMag(vitals) * (0.96 + Math.random() * 0.2);
      let dmg = damageToEnemyMagical(raw, en);
      const el = sk.element || (isPro ? p.lotgElement : u.element) || "Neutral";
      dmg = Math.floor(dmg * elementalDamageMult(el, en.element || "Neutral"));
      if (isPro && Math.random() < pd.crit * 0.72) dmg = Math.floor(dmg * 1.32);
      dmg = Math.max(1, dmg);
      en.hp -= dmg;
      en.lotgVulnerable = { pct: c.vulnPct != null ? c.vulnPct : 0.14, turns: c.vulnTurns != null ? c.vulnTurns : 3 };
      return {
        ok: true,
        log:
          (isPro ? p.name : u.name) +
          ": «" +
          sk.name +
          "» — " +
          en.name +
          " −" +
          dmg +
          "; vulnerable +" +
          Math.round((en.lotgVulnerable.pct || 0) * 100) +
          "% daño (" +
          (en.lotgVulnerable.turns || 0) +
          " r.)." +
          cdNote(),
      };
    }
    if (c.kind === "debuff_en_1") {
      const en = combatEnemies[enemyIdx];
      if (!en || en.hp <= 0) return { ok: false, log: "Sin objetivo." };
      payCost();
      const coef = c.coef || 0.5;
      const raw = isPro
        ? lotgProtagMagicalRaw(cs, atkZone, cb, coef * 0.94)
        : allyCombatStats(u).atkM * coef * allyM * allyBattleStanceMag(vitals) * (0.98 + Math.random() * 0.2);
      let dmg = damageToEnemyMagical(raw, en);
      const el = sk.element || (isPro ? p.lotgElement : u.element) || "Neutral";
      dmg = Math.floor(dmg * elementalDamageMult(el, en.element || "Neutral"));
      dmg = Math.max(1, dmg);
      en.hp -= dmg;
      const down = Math.max(6, Math.floor(Number(c.enDown) || 16));
      const turns = Math.max(1, Math.floor(Number(c.enTurns) || 3));
      const cur = en.lotgEnemyDebuff || { enFlat: 0, viFlat: 0, maFlat: 0, turns: 0 };
      cur.enFlat = Math.max(cur.enFlat || 0, down);
      cur.turns = Math.max(cur.turns || 0, turns);
      en.lotgEnemyDebuff = cur;
      return {
        ok: true,
        log:
          (isPro ? p.name : u.name) +
          ": «" +
          sk.name +
          "» — " +
          en.name +
          " −" +
          dmg +
          "; EN -" +
          down +
          " (" +
          turns +
          " ronda(s))." +
          cdNote(),
      };
    }
    if (c.kind === "debuff_en_aoe") {
      payCost();
      const alive = combatEnemies.filter((x) => x.hp > 0);
      const coef = c.coef || 0.34;
      const turns = Math.max(1, Math.floor(Number(c.enTurns) || 2));
      const down = Math.max(4, Math.floor(Number(c.enDown) || 10));
      const parts = [];
      alive.forEach((en) => {
        const raw = isPro
          ? lotgProtagMagicalRaw(cs, atkZone, cb, coef * 0.92)
          : allyCombatStats(u).atkM * coef * allyM * allyBattleStanceMag(vitals) * (0.95 + Math.random() * 0.2);
        const sp = alive.length > 1 ? 0.64 : 1;
        let dmg = damageToEnemyMagical(raw * sp, en);
        const el = sk.element || (isPro ? p.lotgElement : u.element) || "Neutral";
        dmg = Math.floor(dmg * elementalDamageMult(el, en.element || "Neutral"));
        dmg = Math.max(1, dmg);
        en.hp -= dmg;
        const cur = en.lotgEnemyDebuff || { enFlat: 0, viFlat: 0, maFlat: 0, turns: 0 };
        cur.enFlat = Math.max(cur.enFlat || 0, down);
        cur.turns = Math.max(cur.turns || 0, turns);
        en.lotgEnemyDebuff = cur;
        parts.push(en.name + " −" + dmg);
      });
      return {
        ok: true,
        log:
          (isPro ? p.name : u.name) +
          ": «" +
          sk.name +
          "» — " +
          parts.join(", ") +
          "; EN -" +
          down +
          " (" +
          turns +
          " r.)." +
          cdNote(),
      };
    }
    if (c.kind === "debuff_enemy_damage_1") {
      const en = combatEnemies[enemyIdx];
      if (!en || en.hp <= 0) return { ok: false, log: "Sin objetivo." };
      payCost();
      const coef = c.coef || 0.42;
      const raw = isPro
        ? lotgProtagMagicalRaw(cs, atkZone, cb, coef * 0.9)
        : allyCombatStats(u).atkM * coef * allyM * allyBattleStanceMag(vitals) * (0.95 + Math.random() * 0.22);
      let dmg = damageToEnemyMagical(raw, en);
      dmg = Math.floor(dmg * elementalDamageMult(sk.element || "Neutral", en.element || "Neutral"));
      dmg = Math.max(1, dmg);
      en.hp -= dmg;
      const pct = Math.min(0.55, Math.max(0.08, Number(c.atkDownPct) || 0.2));
      const turns = Math.max(1, Math.floor(Number(c.atkDownTurns) || 3));
      en.lotgOutDamageDebuff = { pct: Math.max((en.lotgOutDamageDebuff && en.lotgOutDamageDebuff.pct) || 0, pct), turns: Math.max((en.lotgOutDamageDebuff && en.lotgOutDamageDebuff.turns) || 0, turns) };
      return {
        ok: true,
        log:
          (isPro ? p.name : u.name) +
          ": «" +
          sk.name +
          "» — " +
          en.name +
          " hace -" +
          Math.round(pct * 100) +
          "% daño (" +
          turns +
          " r.)." +
          cdNote(),
      };
    }
    if (c.kind === "debuff_enemy_damage_aoe") {
      payCost();
      const alive = combatEnemies.filter((x) => x.hp > 0);
      const pct = Math.min(0.45, Math.max(0.08, Number(c.atkDownPct) || 0.16));
      const turns = Math.max(1, Math.floor(Number(c.atkDownTurns) || 2));
      alive.forEach((en) => {
        en.lotgOutDamageDebuff = { pct: Math.max((en.lotgOutDamageDebuff && en.lotgOutDamageDebuff.pct) || 0, pct), turns: Math.max((en.lotgOutDamageDebuff && en.lotgOutDamageDebuff.turns) || 0, turns) };
      });
      return {
        ok: true,
        log:
          (isPro ? p.name : u.name) +
          ": «" +
          sk.name +
          "» — horda enemiga -" +
          Math.round(pct * 100) +
          "% daño (" +
          turns +
          " r.)." +
          cdNote(),
      };
    }
    if (c.kind === "buff_team_guard") {
      payCost();
      const pct = Math.min(0.55, Math.max(0.08, Number(c.guardPct) || 0.18));
      const turns = Math.max(1, Math.floor(Number(c.guardTurns) || 3));
      if (!lotgState.combatGuardBuff) lotgState.combatGuardBuff = { pct: 0, turns: 0 };
      lotgState.combatGuardBuff.pct = Math.max(lotgState.combatGuardBuff.pct || 0, pct);
      lotgState.combatGuardBuff.turns = Math.max(lotgState.combatGuardBuff.turns || 0, turns);
      return {
        ok: true,
        log:
          "«" +
          sk.name +
          "» — guardia de equipo: -" +
          Math.round(pct * 100) +
          "% daño recibido (" +
          turns +
          " ronda(s) enemigas)." +
          cdNote(),
      };
    }
    if (c.kind === "buff_self_mod") {
      payCost();
      const turns = Math.max(1, Math.floor(Number(c.modTurns) || 4));
      if (isPro) {
        if (!lotgState.protagBattleMods) lotgState.protagBattleMods = { physPct: 0, magPct: 0, turns: 0 };
        lotgState.protagBattleMods.physPct = Math.max(lotgState.protagBattleMods.physPct || 0, c.physPct || 0);
        lotgState.protagBattleMods.magPct = Math.max(lotgState.protagBattleMods.magPct || 0, c.magPct || 0);
        lotgState.protagBattleMods.turns = Math.max(lotgState.protagBattleMods.turns || 0, turns);
      } else {
        vitals.battleMods.physPct = Math.max(vitals.battleMods.physPct || 0, c.physPct || 0);
        vitals.battleMods.magPct = Math.max(vitals.battleMods.magPct || 0, c.magPct || 0);
        vitals.battleMods.turns = Math.max(vitals.battleMods.turns || 0, turns);
      }
      return {
        ok: true,
        log:
          (isPro ? p.name : u.name) +
          ": «" +
          sk.name +
          "» — postura ofensiva (" +
          turns +
          " ronda(s) enemiga(s))." +
          cdNote(),
      };
    }
    return { ok: false, log: "Técnica no implementada." };
  }

  function allySkillPrecheck(u, vitals) {
    const sk = u.skill;
    if (!sk) return { ok: false, log: u.name + " no tiene habilidad definida." };
    const cost = sk.sp != null ? sk.sp : 16;
    if (vitals.sp < cost) return { ok: false, log: u.name + " no tiene SP suficiente (" + vitals.sp + "/" + cost + ")." };
    if (vitals.skillCd > 0) {
      return { ok: false, log: u.name + " — habilidad en CD (" + vitals.skillCd + " ronda(s) enemiga(s))." };
    }
    return { ok: true, sk };
  }

  function payAllySkillCost(u, vitals, sk) {
    const cost = sk.sp != null ? sk.sp : 16;
    vitals.sp -= cost;
    vitals.skillCd = sk.cd != null ? sk.cd : 3;
  }

  function allySkillPctFromLine(line, fallback) {
    const m = String(line || "").match(/(\d+)%/);
    if (m) return parseInt(m[1], 10) / 100;
    return fallback != null ? fallback : 0.22;
  }

  /** Perfil de objetivo y tipo de efecto para habilidades de aliados (similar a HSR: ST vs área). */
  function parseAllySkillProfile(u) {
    const sk = u.skill;
    if (!sk) return { kind: "none" };
    const dmg = String(sk.dmg || "");
    const dl = dmg.toLowerCase();
    const role = String(u.role || "");
    if (
      /\bcura\b|sanaci|restaur|grupo.*hp|hp.*grupo/i.test(dmg) ||
      (role.indexOf("Healer") >= 0 && /\d+%/.test(dmg) && !/\d+%\s*ma|\d+%\s*stg|daño|dmg/i.test(dmg))
    ) {
      const aoe = /grupo|equipo|área|area|todos|todas/i.test(dmg);
      return { kind: "heal", aoe, pct: allySkillPctFromLine(dmg, 0.22) };
    }
    if (/debuff|−\d|vulnerabilidad|precisi[oó]n enem|niebla|rallent|ralenti/i.test(dl))
      return { kind: "debuff", aoe: /área|area|horda|todos/i.test(dl) };
    if (/^buff|buff:|\+.*%\s*(ag|def|res|ma|equipo)|res.*mágica|def.*mágica/i.test(dl))
      return { kind: "buff", aoe: /equipo|grupo|área|area|todos/i.test(dmg) };
    const aoe = /área|area|horda|todos|todas/i.test(dl);
    const magical = /\bMA\b|mágico|mágica|cu[aá]ntico/i.test(dmg) || /\d+%\s*MA/i.test(dmg);
    const firearm = /\bDX\b|\barma de fuego\b|pistola|rifle|disparo|bal[aí]stic|sniper|francotirador/i.test(dmg);
    return { kind: "damage", aoe, magical, firearm };
  }

  function allySkillCoefFromDmg(sk, profile) {
    const m = String((sk && sk.dmg) || "").match(/(\d+)%/);
    if (m) return parseInt(m[1], 10) / 100;
    if (profile.firearm) return 1.68;
    return profile.magical ? 1.72 : 1.58;
  }

  function applyAllySkillEffect(u, p, cs, atkMult, profile, enemyIdx, allyTarget) {
    const sk = u.skill;
    const st = allyCombatStats(u);
    const skName = (sk && sk.name) || "habilidad";

    if (profile.kind === "heal") {
      const pct = profile.pct || 0.22;
      if (profile.aoe) {
        p.hpCur = Math.min(cs.hpMax, p.hpCur + Math.floor(cs.hpMax * pct));
        getPartyUnits().forEach((al) => {
          const v2 = lotgState.combatAllyVitals[al.uid];
          if (!v2 || v2.hp <= 0) return;
          const am = allyCombatStats(al);
          v2.hp = Math.min(am.hpMax, v2.hp + Math.floor(am.hpMax * pct));
        });
        return { log: u.name + ": «" + skName + "» — sanación en grupo." };
      }
      if (allyTarget === "protag") {
        p.hpCur = Math.min(cs.hpMax, p.hpCur + Math.floor(cs.hpMax * pct));
        return { log: u.name + ": «" + skName + "» — cura al doctor." };
      }
      const al = getPartyUnits().find((x) => x.uid === allyTarget);
      if (!al) return { log: u.name + ": objetivo inválido." };
      const v2 = lotgState.combatAllyVitals[al.uid];
      const am = allyCombatStats(al);
      if (!v2 || v2.hp <= 0) return { log: u.name + ": objetivo caído." };
      v2.hp = Math.min(am.hpMax, v2.hp + Math.floor(am.hpMax * pct));
      return { log: u.name + ": «" + skName + "» — cura a " + al.name + "." };
    }

    if (profile.kind === "buff") {
      if (profile.aoe) {
        if (!lotgState.combatBuff) lotgState.combatBuff = { atkMult: 1, turns: 0 };
        lotgState.combatBuff.atkMult = Math.max(lotgState.combatBuff.atkMult || 1, 1.12);
        lotgState.combatBuff.turns = Math.max(lotgState.combatBuff.turns || 0, 4);
        return { log: u.name + ": «" + skName + "» — refuerzo de equipo (4 turnos)." };
      }
      if (allyTarget === "protag") return { log: u.name + ": «" + skName + "» — brío al doctor (+temporal)." };
      const al = getPartyUnits().find((x) => x.uid === allyTarget);
      if (!al) return { log: u.name + ": objetivo inválido." };
      return { log: u.name + ": «" + skName + "» — brío a " + al.name + "." };
    }

    if (profile.kind === "debuff") {
      const am = (atkMult || 1) * 1.2;
      const coef = allySkillCoefFromDmg(sk, { magical: true });
      const rawSmall = (st.atkM * coef * 0.48 + st.atkP * 0.24) * am * (0.92 + Math.random() * 0.22);
      const aliveN = combatEnemies.filter((x) => x.hp > 0).length;
      if (profile.aoe) {
        const parts = [];
        combatEnemies.forEach((en) => {
          if (en.hp <= 0) return;
          let raw = rawSmall * (aliveN > 1 ? 0.62 : 1);
          let dmg = damageToEnemyMagical(raw, en);
          dmg = Math.floor(dmg * elementalDamageMult(u.element || "Neutral", en.element || "Neutral"));
          dmg = Math.max(1, dmg);
          en.hp -= dmg;
          parts.push(en.name + " −" + dmg);
        });
        return { log: u.name + ": «" + skName + "» — debilitación en área: " + parts.join(", ") + "." };
      }
      const en = combatEnemies[enemyIdx];
      if (!en || en.hp <= 0) return { log: "Sin objetivo." };
      let dmg = damageToEnemyMagical(rawSmall, en);
      dmg = Math.floor(dmg * elementalDamageMult(u.element || "Neutral", en.element || "Neutral"));
      dmg = Math.max(1, dmg);
      en.hp -= dmg;
      return { log: u.name + ": «" + skName + "» — debuff a " + en.name + " (" + dmg + ")." };
    }

    const am = (atkMult || 1) * 1.2;
    const coef = allySkillCoefFromDmg(sk, profile);
    const hordeN = combatEnemies.filter((en) => en.hp > 0).length;
    const spread = hordeN > 1 ? (profile.aoe ? 0.52 : 1) : 1;
    if (profile.aoe) {
      const parts = [];
      const firearmRaw = allyFirearmRaw(u, lotgState.combatAllyVitals && lotgState.combatAllyVitals[u.uid], am, coef);
      const rawBase =
        (profile.firearm
          ? firearmRaw
          : profile.magical
            ? st.atkM * coef * 0.98 + st.atkP * 0.34
            : st.atkP * coef * 1.04 + st.atkM * 0.28) *
        (profile.firearm ? 1 : am) *
        (1.02 + Math.random() * 0.28);
      combatEnemies.forEach((en) => {
        if (en.hp <= 0) return;
        const raw = rawBase * spread;
        let dmg = profile.magical ? damageToEnemyMagical(raw, en) : damageToEnemyPhysical(raw, en);
        dmg = Math.floor(dmg * elementalDamageMult(u.element || "Neutral", en.element || "Neutral"));
        dmg = Math.max(1, dmg);
        en.hp -= dmg;
        parts.push(en.name + " −" + dmg);
      });
      return { log: u.name + ": «" + skName + "» — " + parts.join(", ") + "." };
    }
    const en = combatEnemies[enemyIdx];
    if (!en || en.hp <= 0) return { log: "Sin objetivo." };
    const firearmOne = allyFirearmRaw(u, lotgState.combatAllyVitals && lotgState.combatAllyVitals[u.uid], am, coef);
    const rawOne =
      (profile.firearm
        ? firearmOne
        : profile.magical
          ? st.atkM * coef * 1.08 + st.atkP * 0.36
          : st.atkP * coef * 1.1 + st.atkM * 0.3) *
      (profile.firearm ? 1 : am) *
      (1.02 + Math.random() * 0.3);
    let dmg = profile.magical ? damageToEnemyMagical(rawOne, en) : damageToEnemyPhysical(rawOne, en);
    dmg = Math.floor(dmg * elementalDamageMult(u.element || "Neutral", en.element || "Neutral"));
    dmg = Math.max(1, dmg);
    en.hp -= dmg;
    return { log: u.name + ": «" + skName + "» — " + en.name + " −" + dmg + "." };
  }

  function cancelCombatPick() {
    combatPickMode = null;
    renderLotgGame({ combatBg: combatBgFromWrap() });
  }

  function handleCombatEnemyPick(enemyIdx) {
    if (!inLotgCombat() || !lotgState || !combatPickMode) return;
    const en = combatEnemies[enemyIdx];
    if (!en || en.hp <= 0) return;
    const p = lotgState.protag;
    const cs = applyEquipToProtag();
    const anomalyOnly =
      lotgState.anomalyBuffFloor === lotgState.floor && lotgState.anomalyBuffAmt ? 1 + lotgState.anomalyBuffAmt : 1;
    const cb = lotgState.combatBuff;
    const buffMult = cb && cb.turns > 0 ? cb.atkMult || 1 : 1;
    const pd = getProtagDerivedDefense();

    function logLine(s) {
      combatLog.push(s);
      if (combatLog.length > 22) combatLog.shift();
    }

    if (combatPickMode.type === "protag_atk") {
      tickCombatRoundStart();
      combatPickMode = null;
      const raw = lotgProtagPhysicalRaw(cs, anomalyOnly, buffMult * protagFreezeDamageMult());
      let dmg = damageToEnemyPhysical(raw, en);
      dmg = Math.floor(dmg * elementalDamageMult(p.lotgElement || "Neutral", en.element || "Neutral"));
      let crit = false;
      if (Math.random() < pd.crit) {
        dmg = Math.floor(dmg * 1.55);
        crit = true;
      }
      en.hp -= dmg;
      logLine("Ataque físico → " + en.name + ": " + dmg + (crit ? " ¡crítico!" : "") + ".");
      if (!anyEnemyAlive()) {
        endCombat(true);
        return;
      }
      beginAllyPhaseAfterPlayer();
      return;
    }

    if (combatPickMode.type === "ally_atk") {
      const allies = getPartyUnits();
      const u = allies.find((x) => x.uid === combatPickMode.uid);
      const vitals = u && lotgState.combatAllyVitals[u.uid];
      if (!u || !vitals || vitals.hp <= 0) {
        combatPickMode = null;
        renderLotgGame({ combatBg: combatBgFromWrap() });
        return;
      }
      const blP = allyBlockedByPara(vitals, "atk");
      if (blP) {
        combatPickMode = null;
        combatLog.push(u.name + ": " + blP);
        if (combatLog.length > 22) combatLog.shift();
        combatAllyIndex = allies.indexOf(u) + 1;
        if (!skipToNextAliveAlly(allies)) {
          combatPhase = "player";
          combatAllyIndex = 0;
          enemyCombatTurn();
        } else renderLotgGame({ combatBg: combatBgFromWrap() });
        return;
      }
      combatPickMode = null;
      const anomalyA =
        lotgState.anomalyBuffFloor === lotgState.floor && lotgState.anomalyBuffAmt ? 1 + lotgState.anomalyBuffAmt : 1;
      const allyAtk = anomalyA * allyConsumableBuffMult(vitals) * allyFreezeDamageMult(vitals) * 1.1;
      const admg = computeAllyDamage(u, en, allyAtk);
      en.hp -= admg;
      combatLog.push(u.name + " ataca: " + admg + ".");
      if (combatLog.length > 22) combatLog.shift();
      if (!anyEnemyAlive()) {
        endCombat(true);
        return;
      }
      combatAllyIndex++;
      if (!skipToNextAliveAlly(allies)) {
        combatPhase = "player";
        combatAllyIndex = 0;
        enemyCombatTurn();
      } else renderLotgGame({ combatBg: combatBgFromWrap() });
      return;
    }

    if (combatPickMode.type === "ally_skill_enemy") {
      const allies = getPartyUnits();
      const u = allies.find((x) => x.uid === combatPickMode.uid);
      const vitals = u && lotgState.combatAllyVitals[u.uid];
      const profile = combatPickMode.profile;
      if (!u || !vitals || !profile) {
        combatPickMode = null;
        renderLotgGame({ combatBg: combatBgFromWrap() });
        return;
      }
      combatPickMode = null;
      payAllySkillCost(u, vitals, u.skill);
      const anomalyS =
        lotgState.anomalyBuffFloor === lotgState.floor && lotgState.anomalyBuffAmt ? 1 + lotgState.anomalyBuffAmt : 1;
      const allySkMult = anomalyS * allyConsumableBuffMult(vitals) * 1.1;
      const r = applyAllySkillEffect(u, p, cs, allySkMult, profile, enemyIdx, null);
      combatLog.push(r.log);
      if (combatLog.length > 22) combatLog.shift();
      if (!anyEnemyAlive()) {
        endCombat(true);
        return;
      }
      combatAllyIndex++;
      if (!skipToNextAliveAlly(allies)) {
        combatPhase = "player";
        combatAllyIndex = 0;
        enemyCombatTurn();
      } else renderLotgGame({ combatBg: combatBgFromWrap() });
      return;
    }

    if (combatPickMode.type === "lotg_skill_enemy") {
      tickCombatRoundStart();
      const skillId = combatPickMode.skillId;
      const who = combatPickMode.who;
      combatPickMode = null;
      const r = applyLotgEquippedSkill(skillId, who, enemyIdx, null);
      combatLog.push(r.ok ? r.log : r.log);
      if (combatLog.length > 22) combatLog.shift();
      if (!anyEnemyAlive()) {
        endCombat(true);
        return;
      }
      if (who === "protag") beginAllyPhaseAfterPlayer();
      else {
        const allies2 = getPartyUnits();
        const u2 = allies2.find((x) => x.uid === who);
        if (!u2) {
          renderLotgGame({ combatBg: combatBgFromWrap() });
          return;
        }
        combatAllyIndex = allies2.indexOf(u2) + 1;
        if (!skipToNextAliveAlly(allies2)) {
          combatPhase = "player";
          combatAllyIndex = 0;
          enemyCombatTurn();
        } else renderLotgGame({ combatBg: combatBgFromWrap() });
      }
      return;
    }

    if (combatPickMode.type === "lotg_ally_skill_enemy") {
      tickCombatRoundStart();
      const skillId = combatPickMode.skillId;
      const uid = combatPickMode.uid;
      combatPickMode = null;
      const r = applyLotgEquippedSkill(skillId, uid, enemyIdx, null);
      combatLog.push(r.log);
      if (combatLog.length > 22) combatLog.shift();
      if (!anyEnemyAlive()) {
        endCombat(true);
        return;
      }
      const allies2 = getPartyUnits();
      const u2 = allies2.find((x) => x.uid === uid);
      combatAllyIndex = u2 ? allies2.indexOf(u2) + 1 : combatAllyIndex + 1;
      if (!skipToNextAliveAlly(allies2)) {
        combatPhase = "player";
        combatAllyIndex = 0;
        enemyCombatTurn();
      } else renderLotgGame({ combatBg: combatBgFromWrap() });
    }
  }

  function handleCombatAllyPick(allyKey) {
    if (!inLotgCombat() || !lotgState || !combatPickMode) return;
    if (combatPickMode.type === "lotg_skill_ally") {
      tickCombatRoundStart();
      const skillId = combatPickMode.skillId;
      const who = combatPickMode.who;
      combatPickMode = null;
      const r = applyLotgEquippedSkill(skillId, who, null, allyKey);
      combatLog.push(r.log);
      if (combatLog.length > 22) combatLog.shift();
      if (!anyEnemyAlive()) {
        endCombat(true);
        return;
      }
      beginAllyPhaseAfterPlayer();
      return;
    }
    if (combatPickMode.type === "lotg_ally_skill_ally") {
      tickCombatRoundStart();
      const skillId = combatPickMode.skillId;
      const uid = combatPickMode.uid;
      combatPickMode = null;
      const r = applyLotgEquippedSkill(skillId, uid, null, allyKey);
      combatLog.push(r.log);
      if (combatLog.length > 22) combatLog.shift();
      if (!anyEnemyAlive()) {
        endCombat(true);
        return;
      }
      const allies = getPartyUnits();
      const u = allies.find((x) => x.uid === uid);
      combatAllyIndex = u ? allies.indexOf(u) + 1 : combatAllyIndex + 1;
      if (!skipToNextAliveAlly(allies)) {
        combatPhase = "player";
        combatAllyIndex = 0;
        enemyCombatTurn();
      } else renderLotgGame({ combatBg: combatBgFromWrap() });
      return;
    }
    if (combatPickMode.type !== "ally_skill_ally") return;
    const p = lotgState.protag;
    const cs = applyEquipToProtag();
    const allies = getPartyUnits();
    const u = allies.find((x) => x.uid === combatPickMode.uid);
    const vitals = u && lotgState.combatAllyVitals[u.uid];
    const profile = combatPickMode.profile;
    if (!u || !vitals || !profile) {
      combatPickMode = null;
      renderLotgGame({ combatBg: combatBgFromWrap() });
      return;
    }
    combatPickMode = null;
    payAllySkillCost(u, vitals, u.skill);
    const anomalyS =
      lotgState.anomalyBuffFloor === lotgState.floor && lotgState.anomalyBuffAmt ? 1 + lotgState.anomalyBuffAmt : 1;
    const allySkMult = anomalyS * allyConsumableBuffMult(vitals) * 1.1;
    const r = applyAllySkillEffect(u, p, cs, allySkMult, profile, null, allyKey);
    combatLog.push(r.log);
    if (combatLog.length > 22) combatLog.shift();
    if (!anyEnemyAlive()) {
      endCombat(true);
      return;
    }
    combatAllyIndex++;
    if (!skipToNextAliveAlly(allies)) {
      combatPhase = "player";
      combatAllyIndex = 0;
      enemyCombatTurn();
    } else renderLotgGame({ combatBg: combatBgFromWrap() });
  }

  function skipToNextAliveAlly(allies) {
    while (combatAllyIndex < allies.length) {
      const u = allies[combatAllyIndex];
      const v = lotgState.combatAllyVitals[u.uid];
      if (v && v.hp > 0) return true;
      combatAllyIndex++;
    }
    return false;
  }

  function beginAllyPhaseAfterPlayer() {
    const allies = getPartyUnits();
    const cbg = combatBgFromWrap();
    if (!allies.length) {
      enemyCombatTurn();
      return;
    }
    combatPhase = "ally";
    combatAllyIndex = 0;
    if (!skipToNextAliveAlly(allies)) {
      combatPhase = "player";
      combatAllyIndex = 0;
      enemyCombatTurn();
    } else renderLotgGame({ combatBg: cbg });
  }

  function tickEnemyDotDamage() {
    if (!combatEnemies.length) return;
    function logLine(s) {
      combatLog.push(s);
      if (combatLog.length > 28) combatLog.shift();
    }
    combatEnemies.forEach((en) => {
      if (!en || en.hp <= 0) return;
      if (en.lotgDotTurns > 0 && en.lotgDotDmg > 0) {
        const d = Math.max(1, Math.floor(en.lotgDotDmg));
        en.hp -= d;
        en.lotgDotTurns--;
        logLine("DoT → " + en.name + ": −" + d + (en.lotgDotTurns > 0 ? " (" + en.lotgDotTurns + "t rest.)" : "") + ".");
      }
    });
  }

  function enemyCombatTurn() {
    if (!inLotgCombat() || !lotgState) return;
    tickEnemyDotDamage();
    if (!anyEnemyAlive()) {
      endCombat(true);
      return;
    }
    const p = lotgState.protag;
    const cs = applyEquipToProtag();
    const cbg = combatBgFromWrap();
    function logLine(s) {
      combatLog.push(s);
      if (combatLog.length > 28) combatLog.shift();
    }
    lotgPartyBurnTick(logLine);
    if (p.hpCur <= 0) {
      endCombat(false);
      return;
    }
    if (!anyEnemyAlive()) {
      endCombat(true);
      return;
    }
    const wave = combatEnemies.filter((en) => en.hp > 0);
    for (let wi = 0; wi < wave.length; wi++) {
      const e = wave[wi];
      if (p.hpCur <= 0) {
        endCombat(false);
        return;
      }
      if (e.hp <= 0) continue;
      ensureEnemyAilments(e);
      const ea = e.ailments;
      if ((ea.sleep || 0) > 0) {
        logLine(e.name + " duerme y no actúa.");
        continue;
      }
      if ((ea.para || 0) > 0 && Math.random() < 0.38) {
        logLine(e.name + " está paralizado y no puede moverse.");
        continue;
      }
      if ((ea.freeze || 0) > 0 && Math.random() < 0.26) {
        logLine(e.name + " resbala bajo congelación y pierde el turno.");
        continue;
      }
      const targets = [];
      if (p.hpCur > 0) targets.push({ kind: "protag", name: p.name, u: null, apply: (dmg) => (p.hpCur -= dmg) });
      getPartyUnits().forEach((u) => {
        const v = lotgState.combatAllyVitals[u.uid];
        if (v && v.hp > 0) targets.push({ kind: "ally", name: u.name, u, apply: (dmg) => (v.hp -= dmg) });
      });
      if (!targets.length) {
        endCombat(false);
        return;
      }
      let skipNormal = false;
      if ((e.statusSkillInternalCd || 0) > 0) {
        e.statusSkillInternalCd--;
      } else if ((ea.silence || 0) <= 0) {
        const specChance = e.boss ? 0.52 : e.miniboss ? 0.46 : 0.38;
        if (Math.random() < specChance) {
          e.statusSkillInternalCd = e.boss ? 2 : e.miniboss ? 2 : 3;
          const rKind = Math.random();
          if (rKind < 0.24) {
            const pickT = targets[Math.floor(Math.random() * targets.length)];
            const aff = pickEnemyStatusAilment(e);
            const tk = pickT.kind === "protag" ? "protag" : pickT.u.uid;
            applyAilmentToTargetParty(tk, aff, 3);
            logLine(
              e.name +
                " — técnica " +
                String(LOTG_AILMENT_LABELS[aff] || aff).toLowerCase() +
                " → " +
                pickT.name +
                " (3 rondas enemigas)."
            );
            skipNormal = true;
          } else if (rKind < 0.48) {
            const pickT = targets[Math.floor(Math.random() * targets.length)];
            const hit = rollEnemyAttackDamage(
              e,
              pickT.kind === "protag" ? { kind: "protag" } : { kind: "ally", u: pickT.u },
              1.4
            );
            if (hit.dodge) logLine(e.name + " — ráfaga mágica falla vs " + pickT.name + ".");
            else {
              pickT.apply(hit.dmg);
              logLine(
                e.name +
                  " — ráfaga mágica → " +
                  pickT.name +
                  ": " +
                  hit.dmg +
                  (hit.crit ? " ¡crítico!" : "") +
                  "."
              );
            }
            skipNormal = true;
          } else if (rKind < 0.72) {
            targets.forEach((pickT) => {
              const hit = rollEnemyAttackDamage(
                e,
                pickT.kind === "protag" ? { kind: "protag" } : { kind: "ally", u: pickT.u },
                0.55
              );
              if (hit.dodge) return;
              pickT.apply(Math.max(2, Math.floor(hit.dmg)));
            });
            logLine(e.name + " — descarga en área contra el equipo.");
            skipNormal = true;
          } else {
            const pickT = targets[Math.floor(Math.random() * targets.length)];
            const hit = rollEnemyAttackDamage(
              e,
              pickT.kind === "protag" ? { kind: "protag" } : { kind: "ally", u: pickT.u },
              1.52
            );
            if (hit.dodge) logLine(e.name + " — embestida falla vs " + pickT.name + ".");
            else {
              pickT.apply(hit.dmg);
              logLine(e.name + " — embestida focal → " + pickT.name + ": " + hit.dmg + "." + (hit.crit ? " ¡crítico!" : ""));
            }
            skipNormal = true;
          }
        }
      }
      if (skipNormal) {
        if (p.hpCur <= 0) {
          endCombat(false);
          return;
        }
        continue;
      }
      const pick = targets[Math.floor(Math.random() * targets.length)];
      const hit = rollEnemyAttackDamage(e, pick.kind === "protag" ? { kind: "protag" } : { kind: "ally", u: pick.u });
      if (hit.dodge) logLine(e.name + " falla contra " + pick.name + " (esquivado).");
      else {
        if ((ea.freeze || 0) > 0 && Math.random() < 0.22) {
          logLine(e.name + " falla bajo congelación contra " + pick.name + ".");
        } else {
          pick.apply(hit.dmg);
          const tag = hit.crit ? " ¡crítico!" : "";
          const elab = hit.mag ? " (mág.)" : " (fís.)";
          logLine(e.name + " → " + pick.name + elab + ": " + hit.dmg + "." + tag);
        }
      }
      if (p.hpCur <= 0) {
        endCombat(false);
        return;
      }
    }
    lotgTickGlobalCooldownsAfterEnemyWave();
    lotgDecrementAllAilmentTurns();
    p.spCur = Math.min(cs.spMax, p.spCur + 4);
    combatPhase = "player";
    combatAllyIndex = 0;
    if (p.hpCur <= 0) endCombat(false);
    else renderLotgGame({ combatBg: cbg });
  }

  function allyCombatTurn(action) {
    if (!inLotgCombat() || !lotgState || combatPhase !== "ally") return;
    const cbg = combatBgFromWrap();
    if (action === "cancel-pick") {
      combatPickMode = null;
      renderLotgGame({ combatBg: cbg });
      return;
    }
    const e = firstAliveEnemy();
    const p = lotgState.protag;
    const cs = applyEquipToProtag();
    const anomaly =
      lotgState.anomalyBuffFloor === lotgState.floor && lotgState.anomalyBuffAmt ? 1 + lotgState.anomalyBuffAmt : 1;
    function logLine(s) {
      combatLog.push(s);
      if (combatLog.length > 22) combatLog.shift();
    }
    const allies = getPartyUnits();
    if (combatAllyIndex >= allies.length) {
      combatPhase = "player";
      combatAllyIndex = 0;
      enemyCombatTurn();
      return;
    }
    const u = allies[combatAllyIndex];
    const vitals = lotgState.combatAllyVitals[u.uid];
    const atkMult = anomaly * allyConsumableBuffMult(vitals) * allyFreezeDamageMult(vitals) * 1.1;
    if (!vitals || vitals.hp <= 0) {
      combatAllyIndex++;
      if (!skipToNextAliveAlly(allies)) {
        combatPhase = "player";
        combatAllyIndex = 0;
        enemyCombatTurn();
      } else renderLotgGame({ combatBg: cbg });
      return;
    }
    if ((mergeAilments(vitals.ailments).sleep || 0) > 0) {
      logLine(u.name + " duerme y no puede actuar.");
      combatAllyIndex++;
      if (!skipToNextAliveAlly(allies)) {
        combatPhase = "player";
        combatAllyIndex = 0;
        enemyCombatTurn();
      } else renderLotgGame({ combatBg: cbg });
      return;
    }
    if (!e) {
      endCombat(true);
      return;
    }
    if (action === "atk") {
      const bl = allyBlockedByPara(vitals, "atk");
      if (bl) {
        logLine(u.name + ": " + bl);
        combatAllyIndex++;
        if (!skipToNextAliveAlly(allies)) {
          combatPhase = "player";
          combatAllyIndex = 0;
          enemyCombatTurn();
        } else renderLotgGame({ combatBg: cbg });
        return;
      }
      const aliveCount = combatEnemies.filter((en) => en.hp > 0).length;
      if (aliveCount <= 1 && e) {
        const admg = computeAllyDamage(u, e, atkMult);
        e.hp -= admg;
        logLine(u.name + " ataca: " + admg + ".");
      } else {
        combatPickMode = { type: "ally_atk", uid: u.uid };
        renderLotgGame({ combatBg: cbg });
        return;
      }
    } else if (action === "pass") {
      logLine(u.name + " espera.");
    } else if (action === "skill") {
      if ((mergeAilments(vitals.ailments).silence || 0) > 0) {
        logLine(u.name + ": silenciada/o — no puede usar su habilidad.");
        combatAllyIndex++;
        if (!skipToNextAliveAlly(allies)) {
          combatPhase = "player";
          combatAllyIndex = 0;
          enemyCombatTurn();
        } else renderLotgGame({ combatBg: cbg });
        return;
      }
      const blS = allyBlockedByPara(vitals, "skill");
      if (blS) {
        logLine(u.name + ": " + blS);
        combatAllyIndex++;
        if (!skipToNextAliveAlly(allies)) {
          combatPhase = "player";
          combatAllyIndex = 0;
          enemyCombatTurn();
        } else renderLotgGame({ combatBg: cbg });
        return;
      }
      const pre = allySkillPrecheck(u, vitals);
      if (!pre.ok) logLine(pre.log);
      else {
        const profile = parseAllySkillProfile(u);
        const needsEnemy =
          (profile.kind === "damage" && !profile.aoe) || (profile.kind === "debuff" && !profile.aoe);
        const needsAlly = (profile.kind === "heal" && !profile.aoe) || (profile.kind === "buff" && !profile.aoe);
        if (needsEnemy) {
          combatPickMode = { type: "ally_skill_enemy", uid: u.uid, profile };
          renderLotgGame({ combatBg: cbg });
          return;
        }
        if (needsAlly) {
          combatPickMode = { type: "ally_skill_ally", uid: u.uid, profile };
          renderLotgGame({ combatBg: cbg });
          return;
        }
        payAllySkillCost(u, vitals, u.skill);
        const r = applyAllySkillEffect(u, p, cs, atkMult, profile, null, null);
        logLine(r.log);
      }
    } else if (typeof action === "string" && action.indexOf("allylotg:") === 0) {
      const skillId = action.slice("allylotg:".length);
      const sk = getLotgBattleSkill(skillId);
      if (!sk || !sk.combat || sk.combat.kind === "passive") {
        logLine("Técnica no disponible.");
      } else if ((mergeAilments(vitals.ailments).silence || 0) > 0) {
        logLine(u.name + ": silenciada/o — técnica equipada bloqueada.");
      } else {
        if (!vitals.extraSkillCd) vitals.extraSkillCd = {};
        const cdAl = vitals.extraSkillCd[skillId] || 0;
        if (cdAl > 0) {
          logLine(u.name + ": «" + (sk.name || "Técnica") + "» en enfriamiento (" + cdAl + " ronda(s) enemiga(s)).");
          renderLotgGame({ combatBg: cbg });
          return;
        }
        const blL = allyBlockedByPara(vitals, "skill");
        if (blL) {
          logLine(u.name + ": " + blL);
        } else {
        const k = sk.combat.kind;
        const aliveN = combatEnemies.filter((en) => en.hp > 0).length;
        if (
          (k === "dmg_mag_1" ||
            k === "dmg_phys_1" ||
            k === "dmg_firearm_1" ||
            k === "dot_main" ||
            k === "status_enemy_1" ||
            k === "phys_double_1" ||
            k === "debuff_vuln_1" ||
            k === "debuff_en_1" ||
            k === "debuff_enemy_damage_1") &&
          aliveN > 1
        ) {
          combatPickMode = { type: "lotg_ally_skill_enemy", uid: u.uid, skillId };
          renderLotgGame({ combatBg: cbg });
          return;
        }
        if (k === "heal_1" || k === "cleanse_1") {
          combatPickMode = { type: "lotg_ally_skill_ally", uid: u.uid, skillId };
          renderLotgGame({ combatBg: cbg });
          return;
        }
        tickCombatRoundStart();
        const idx = combatEnemies.findIndex((x) => x.hp > 0);
        const r = applyLotgEquippedSkill(skillId, u.uid, idx >= 0 ? idx : 0, null);
        if (!r.ok) {
          logLine(r.log);
          renderLotgGame({ combatBg: cbg });
          return;
        }
        logLine(r.log);
        }
      }
    }
    if (!anyEnemyAlive()) {
      endCombat(true);
      return;
    }
    combatAllyIndex++;
    if (!skipToNextAliveAlly(allies)) {
      combatPhase = "player";
      combatAllyIndex = 0;
      enemyCombatTurn();
    } else renderLotgGame({ combatBg: cbg });
  }

  function useConsumableOutsideCombat(invIdx, targetKey) {
    if (!lotgState || inLotgCombat()) return;
    const inv = lotgState.inventory || [];
    if (invIdx < 0 || invIdx >= inv.length) return;
    const it = inv[invIdx];
    normalizeInventoryItem(it);
    if (!["heal", "sp", "buff", "cleanse", "stat"].includes(it.type)) return;
    const tk = targetKey === "protag" ? "protag" : targetKey;
    const cs = applyEquipToProtag();
    const pr = lotgState.protag;
    if (!lotgState.partyVitalsPersist) lotgState.partyVitalsPersist = {};
    if (tk !== "protag") {
      const u = (lotgState.roster || []).find((x) => x && x.uid === tk);
      if (!u) return;
    }
    if (it.type === "heal") {
      const pct = it.healPct != null ? it.healPct : 0.35;
      if (tk === "protag") {
        pr.hpCur = Math.min(cs.hpMax, pr.hpCur + Math.floor(cs.hpMax * pct));
      } else {
        const u = (lotgState.roster || []).find((x) => x.uid === tk);
        const stA = allyCombatStats(u);
        let pv = lotgState.partyVitalsPersist[tk] || { hp: stA.hpMax, sp: stA.spMax };
        pv.hp = Math.min(stA.hpMax, (pv.hp != null ? pv.hp : stA.hpMax) + Math.floor(stA.hpMax * pct));
        lotgState.partyVitalsPersist[tk] = pv;
      }
    } else if (it.type === "sp") {
      const pct = it.spPct != null ? it.spPct : 0.28;
      if (tk === "protag") {
        pr.spCur = Math.min(cs.spMax, pr.spCur + Math.floor(cs.spMax * pct));
      } else {
        const u = (lotgState.roster || []).find((x) => x.uid === tk);
        const stA = allyCombatStats(u);
        let pv = lotgState.partyVitalsPersist[tk] || { hp: stA.hpMax, sp: stA.spMax };
        pv.sp = Math.min(stA.spMax, (pv.sp != null ? pv.sp : stA.spMax) + Math.floor(stA.spMax * pct));
        lotgState.partyVitalsPersist[tk] = pv;
      }
    } else if (it.type === "buff") {
      const mult = 1 + (it.atkPct != null ? it.atkPct : 0.1);
      const turns = it.turns != null ? it.turns : 4;
      if (tk === "protag") {
        lotgState.runCombatAtkMult = Math.max(lotgState.runCombatAtkMult || 1, mult);
        lotgState.runCombatAtkFights = (lotgState.runCombatAtkFights || 0) + (it.turns != null ? it.turns : 4);
      } else {
        lotgState.stagingAllyItemBuff = { uid: tk, mult: mult, turns: turns };
      }
    } else if (it.type === "cleanse") {
      /* Fuera de combate: limpia marcas narrativas; en combate usa el flujo de objetivo. */
      if (tk === "protag") lotgState.protagAilments = { silence: 0, sleep: 0, burn: 0, freeze: 0, para: 0 };
    } else if (it.type === "stat") {
      const mult = 1 + (it.statBuffPct != null ? it.statBuffPct : 0.08);
      const turns = it.turns != null ? it.turns : 5;
      if (tk === "protag") {
        lotgState.runCombatAtkMult = Math.max(lotgState.runCombatAtkMult || 1, mult);
        lotgState.runCombatAtkFights = (lotgState.runCombatAtkFights || 0) + turns;
      } else {
        lotgState.stagingAllyItemBuff = { uid: tk, mult: mult, turns: turns };
      }
    }
    inv.splice(invIdx, 1);
    lotgState._consumablePickIdx = null;
    lotgSave();
    renderLotgGame();
  }

  function combatTurnItem(invIdx) {
    if (!inLotgCombat() || !lotgState || combatPhase !== "player" || combatPickMode) return;
    const inv = lotgState.inventory || [];
    if (invIdx < 0 || invIdx >= inv.length) return;
    const it = inv[invIdx];
    normalizeInventoryItem(it);
    if (!["heal", "sp", "buff", "cleanse", "stat"].includes(it.type)) {
      combatLog.push("«" + (it.name || "Objeto") + "» no es usable en combate.");
      if (combatLog.length > 22) combatLog.shift();
      renderLotgGame({ combatBg: combatBgFromWrap() });
      return;
    }
    combatPickMode = { type: "consumable_target", invIdx: invIdx };
    renderLotgGame({ combatBg: combatBgFromWrap() });
  }

  function handleCombatConsumableTarget(targetKey) {
    if (!inLotgCombat() || !lotgState || combatPhase !== "player" || !combatPickMode || combatPickMode.type !== "consumable_target")
      return;
    const invIdx = combatPickMode.invIdx;
    const p = lotgState.protag;
    const cs = applyEquipToProtag();
    const inv = lotgState.inventory || [];
    if (invIdx < 0 || invIdx >= inv.length) {
      combatPickMode = null;
      renderLotgGame({ combatBg: combatBgFromWrap() });
      return;
    }
    const it = inv[invIdx];
    normalizeInventoryItem(it);
    if (!["heal", "sp", "buff", "cleanse", "stat"].includes(it.type)) {
      combatPickMode = null;
      renderLotgGame({ combatBg: combatBgFromWrap() });
      return;
    }
    function logLine(s) {
      combatLog.push(s);
      if (combatLog.length > 22) combatLog.shift();
    }
    const tk = targetKey === "protag" ? "protag" : targetKey;
    if (tk !== "protag") {
      const u = getPartyUnits().find((x) => x.uid === tk);
      const vitals = u && lotgState.combatAllyVitals[u.uid];
      if (!u || !vitals || vitals.hp <= 0) {
        logLine("Objetivo no válido o caído.");
        renderLotgGame({ combatBg: combatBgFromWrap() });
        return;
      }
    }
    tickCombatRoundStart();
    combatPickMode = null;
    inv.splice(invIdx, 1);
    const tName = tk === "protag" ? p.name : getPartyUnits().find((x) => x.uid === tk).name;
    if (it.type === "heal") {
      const pct = it.healPct != null ? it.healPct : 0.35;
      if (tk === "protag") {
        const heal = Math.floor(cs.hpMax * pct);
        p.hpCur = Math.min(cs.hpMax, p.hpCur + heal);
        logLine("Usas «" + it.name + "» en " + tName + ": +" + heal + " HP.");
      } else {
        const u = getPartyUnits().find((x) => x.uid === tk);
        const vitals = lotgState.combatAllyVitals[u.uid];
        const stA = allyCombatStats(u);
        const heal = Math.floor(stA.hpMax * pct);
        vitals.hp = Math.min(stA.hpMax, vitals.hp + heal);
        logLine("Usas «" + it.name + "» en " + tName + ": +" + heal + " HP.");
      }
    } else if (it.type === "sp") {
      const pct = it.spPct != null ? it.spPct : 0.28;
      if (tk === "protag") {
        const sp = Math.floor(cs.spMax * pct);
        p.spCur = Math.min(cs.spMax, p.spCur + sp);
        logLine("Usas «" + it.name + "» en " + tName + ": +" + sp + " SP.");
      } else {
        const u = getPartyUnits().find((x) => x.uid === tk);
        const vitals = lotgState.combatAllyVitals[u.uid];
        const stA = allyCombatStats(u);
        const sp = Math.floor(stA.spMax * pct);
        vitals.sp = Math.min(stA.spMax, vitals.sp + sp);
        logLine("Usas «" + it.name + "» en " + tName + ": +" + sp + " SP.");
      }
    } else if (it.type === "buff") {
      const mult = 1 + (it.atkPct || 0.1);
      const turns = it.turns || 4;
      if (tk === "protag") {
        if (!lotgState.combatBuff) lotgState.combatBuff = { atkMult: 1, turns: 0 };
        lotgState.combatBuff.atkMult = mult;
        lotgState.combatBuff.turns = turns;
        logLine(
          "Usas «" +
            it.name +
            "» en " +
            tName +
            ": +" +
            Math.round((it.atkPct || 0.1) * 100) +
            "% daño (" +
            turns +
            " turnos propios del doctor)."
        );
      } else {
        const u = getPartyUnits().find((x) => x.uid === tk);
        const vitals = lotgState.combatAllyVitals[u.uid];
        vitals.consumableBuffMult = mult;
        vitals.consumableBuffTurns = turns;
        logLine(
          "Usas «" +
            it.name +
            "» en " +
            tName +
            ": +" +
            Math.round((it.atkPct || 0.1) * 100) +
            "% daño (" +
            turns +
            " turnos propios de esa unidad)."
        );
      }
    } else if (it.type === "cleanse") {
      clearTargetAilments(tk);
      logLine("Usas «" + it.name + "» en " + tName + ": estados alterados limpiados.");
    } else if (it.type === "stat") {
      const mult = 1 + (it.statBuffPct != null ? it.statBuffPct : 0.08);
      const turns = it.turns != null ? it.turns : 5;
      if (tk === "protag") {
        if (!lotgState.combatBuff) lotgState.combatBuff = { atkMult: 1, turns: 0 };
        lotgState.combatBuff.atkMult = Math.max(lotgState.combatBuff.atkMult || 1, mult);
        lotgState.combatBuff.turns = Math.max(lotgState.combatBuff.turns || 0, turns);
        logLine("Usas «" + it.name + "» en " + tName + ": refuerzo temporal de daño.");
      } else {
        const u = getPartyUnits().find((x) => x.uid === tk);
        const vitals = lotgState.combatAllyVitals[u.uid];
        vitals.consumableBuffMult = mult;
        vitals.consumableBuffTurns = turns;
        logLine("Usas «" + it.name + "» en " + tName + ": potencia temporal.");
      }
    }
    if (!anyEnemyAlive()) {
      endCombat(true);
      return;
    }
    beginAllyPhaseAfterPlayer();
  }

  function combatTurn(action) {
    if (!inLotgCombat() || !lotgState || combatPhase !== "player") return;
    if (action === "cancel-pick") {
      combatPickMode = null;
      renderLotgGame({ combatBg: combatBgFromWrap() });
      return;
    }
    const aliveDefer = combatEnemies.filter((en) => en.hp > 0).length;
    const p = lotgState.protag;
    const cs = applyEquipToProtag();
    const atkMult =
      lotgState.anomalyBuffFloor === lotgState.floor && lotgState.anomalyBuffAmt ? 1 + lotgState.anomalyBuffAmt : 1;
    const cb = lotgState.combatBuff;
    const buffMult = cb && cb.turns > 0 ? cb.atkMult || 1 : 1;
    const pd = getProtagDerivedDefense();

    function logLine(s) {
      combatLog.push(s);
      if (combatLog.length > 22) combatLog.shift();
    }

    if (typeof action === "string" && action.indexOf("lotgextra:") === 0) {
      const skillId = action.slice("lotgextra:".length);
      const sk = getLotgBattleSkill(skillId);
      if (!sk || !sk.combat || sk.combat.kind === "passive") {
        logLine("Técnica no disponible o es pasiva (no se usa en combate).");
        renderLotgGame({ combatBg: combatBgFromWrap() });
        return;
      }
      if (!lotgState.protagExtraSkillCd || typeof lotgState.protagExtraSkillCd !== "object") lotgState.protagExtraSkillCd = {};
      const cdRem = lotgState.protagExtraSkillCd[skillId] || 0;
      if (cdRem > 0) {
        logLine("«" + (sk.name || "Técnica") + "» en enfriamiento (" + cdRem + " ronda(s) enemiga(s)).");
        renderLotgGame({ combatBg: combatBgFromWrap() });
        return;
      }
      const paX = mergeAilments(lotgState.protagAilments);
      if ((paX.silence || 0) > 0) {
        logLine("Silencio: no podés usar técnicas equipadas.");
        renderLotgGame({ combatBg: combatBgFromWrap() });
        return;
      }
      const blX = protagBlockedBySleepPara(action);
      if (blX) {
        logLine(blX);
        tickCombatRoundStart();
        beginAllyPhaseAfterPlayer();
        return;
      }
      const k = sk.combat.kind;
      const needsEnemy =
        k === "dmg_mag_1" ||
        k === "dmg_phys_1" ||
        k === "dmg_firearm_1" ||
        k === "dot_main" ||
        k === "status_enemy_1" ||
        k === "phys_double_1" ||
        k === "debuff_vuln_1" ||
        k === "debuff_en_1" ||
        k === "debuff_enemy_damage_1";
      const needsAlly = k === "heal_1" || k === "cleanse_1";
      if (needsEnemy && aliveDefer > 1) {
        combatPickMode = { type: "lotg_skill_enemy", who: "protag", skillId };
        renderLotgGame({ combatBg: combatBgFromWrap() });
        return;
      }
      if (needsAlly) {
        combatPickMode = { type: "lotg_skill_ally", who: "protag", skillId };
        renderLotgGame({ combatBg: combatBgFromWrap() });
        return;
      }
      tickCombatRoundStart();
      const idx = combatEnemies.findIndex((x) => x.hp > 0);
      const r = applyLotgEquippedSkill(skillId, "protag", idx >= 0 ? idx : 0, null);
      if (!r.ok) {
        logLine(r.log);
        renderLotgGame({ combatBg: combatBgFromWrap() });
        return;
      }
      logLine(r.log);
      if (!anyEnemyAlive()) {
        endCombat(true);
        return;
      }
      beginAllyPhaseAfterPlayer();
      return;
    }

    if (action === "skill") {
      const paSk = mergeAilments(lotgState.protagAilments);
      if ((paSk.silence || 0) > 0) {
        logLine("Silencio: no podés vocalizar la técnica del doctor.");
        tickCombatRoundStart();
        beginAllyPhaseAfterPlayer();
        return;
      }
      const blSk = protagBlockedBySleepPara(action);
      if (blSk) {
        logLine(blSk);
        tickCombatRoundStart();
        beginAllyPhaseAfterPlayer();
        return;
      }
      if (skillCdPro > 0) {
        logLine(
          "Técnica del doctor en enfriamiento (" + skillCdPro + " ronda(s) enemiga(s)). Elegí otra acción — no perdés el turno."
        );
        renderLotgGame({ combatBg: combatBgFromWrap() });
        return;
      }
      if (p.spCur < 18) {
        logLine("No tienes suficiente SP.");
        renderLotgGame({ combatBg: combatBgFromWrap() });
        return;
      }
    }

    if (action === "atk") {
      const blAtk0 = protagBlockedBySleepPara(action);
      if (blAtk0) {
        logLine(blAtk0);
        tickCombatRoundStart();
        beginAllyPhaseAfterPlayer();
        return;
      }
    }

    if (!(action === "atk" && aliveDefer > 1)) tickCombatRoundStart();

    if (action === "flee") {
      if (combatEnemies.some((en) => en && en.boss)) {
        logLine("¡No puedes huir mientras haya un jefe de piso en el campo!");
      } else if (Math.random() < 0.45 + cs.agi * 0.002) {
        logLine("Lograste retirarte del encuentro.");
        if (lotgState) {
          snapshotPartyVitalsToPersist();
          lotgState._pendingMapCellKey = null;
        }
        combatEnemies = [];
        if (lotgState.combatAllyVitals) delete lotgState.combatAllyVitals;
        combatPhase = "player";
        combatAllyIndex = 0;
        playLotgTrack("safe", "Safe Area");
        renderLotgGame();
        return;
      } else logLine("Fallaste al huir.");
    } else if (action === "atk") {
      const aliveN = combatEnemies.filter((en) => en.hp > 0).length;
      const e = firstAliveEnemy();
      if (!e) {
        endCombat(true);
        return;
      }
      if (aliveN <= 1) {
        const raw = lotgProtagPhysicalRaw(cs, atkMult, buffMult * protagFreezeDamageMult());
        let dmg = damageToEnemyPhysical(raw, e);
        dmg = Math.floor(dmg * elementalDamageMult(p.lotgElement || "Neutral", e.element || "Neutral"));
        let crit = false;
        if (Math.random() < pd.crit) {
          dmg = Math.floor(dmg * 1.55);
          crit = true;
        }
        e.hp -= dmg;
        logLine("Ataque físico → " + e.name + ": " + dmg + (crit ? " ¡crítico!" : "") + ".");
      } else {
        combatPickMode = { type: "protag_atk" };
        renderLotgGame({ combatBg: combatBgFromWrap() });
        return;
      }
    } else if (action === "skill") {
      p.spCur -= 18;
      skillCdPro = 3;
      const skn = p.skillActive && p.skillActive.name ? p.skillActive.name : "Grúa clínica";
      const alive = combatEnemies.filter((en) => en.hp > 0);
      const parts = [];
      alive.forEach((en) => {
        const raw = lotgProtagMagicalRaw(cs, atkMult, buffMult * protagFreezeDamageMult(), 1.32);
        const spread = alive.length > 1 ? 0.52 : 1;
        let dmg = damageToEnemyMagical(raw * spread, en);
        dmg = Math.floor(dmg * elementalDamageMult(p.lotgElement || "Neutral", en.element || "Neutral"));
        if (Math.random() < pd.crit * 0.92) dmg = Math.floor(dmg * 1.45);
        dmg = Math.max(1, dmg);
        en.hp -= dmg;
        parts.push(en.name + " −" + dmg);
      });
      logLine("«" + skn + "» (área): " + parts.join(" · ") + ".");
    }

    if (!anyEnemyAlive()) {
      endCombat(true);
      return;
    }
    beginAllyPhaseAfterPlayer();
  }

  function lotgSocialArchetypeForRosterUnit(u) {
    if (!u) return "kuudere";
    let h = 0;
    const s = String(u.uid || "") + String(u.name || "");
    for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i) * (i + 3)) % 1009;
    const arcs = ["tsundere", "kuudere", "dandere", "genki"];
    return arcs[h % arcs.length];
  }

  function socialLinkTierFromLevel(L) {
    return L <= 2 ? 0 : L <= 5 ? 1 : L <= 8 ? 2 : 3;
  }

  function socialVNPage(title, speaker, expression, vnMood, text) {
    return { title, speaker, expression, vnMood, text };
  }

  function socialArchetypeIntroPages(arc, tier, linkLv, unitName, doctorName) {
    const TK = ["primer contacto", "pasos medidos", "terreno compartido", "cruce sin mapa"][tier];
    const cierre =
      tier <= 1
        ? `El vínculo ${linkLv}/10 todavía aprende a caminar; no prometo fuegos artificiales, solo constancia.`
        : tier === 2
          ? `En ${linkLv}/10 ya no es casualidad: es hábito peligroso y hermoso a la vez.`
          : `Si ${linkLv}/10 es techo o piso, lo decidimos con la próxima elección; no con el miedo.`;
    const lib = {
      tsundere: [
        socialVNPage(
          "Encuentro · " + unitName,
          unitName,
          "defensiva elegante",
          "tension",
          doctorName +
            "… no es que te estuviera esperando junto a la máquina expendedora. El hospital suena a zapatillas mojadas y a KPIs inútiles; si vas a quedarte, que sea porque elegís quedarte, no porque el turno lo mande."
        ),
        socialVNPage(
          "Márgenes del relato",
          doctorName,
          "voz baja, exacta",
          "calm",
          "Guardo el celular. " +
            unitName +
            " habla con púas que son también salvavidas. «Puedo escuchar otra versión», ofrezco, y los minutos que prometo no son de cuento: son de tiempo robado al colapso."
        ),
        socialVNPage("Vínculo " + linkLv + "/10 · " + TK, unitName, "casi un gesto dulce", "calm", cierre),
      ],
      kuudere: [
        socialVNPage(
          "Silencio útil",
          unitName,
          "mirada fija al vitral",
          "serious",
          "El reflejo de las luces de neón se parte en el cristal como una frase incompleta. " +
            doctorName +
            ": una sola cosa que no esté en el parte. Si no hay nada, seguimos en silencio; el silencio también es dato."
        ),
        socialVNPage(
          "Lectura lateral",
          doctorName,
          "economía de gestos",
          "calm",
          "Asiento. " +
            unitName +
            " no pide drama; pide coherencia. Leo su postura como un monitor: alertas suaves, no alarmas ruidosas."
        ),
        socialVNPage("Nivel " + linkLv + " · " + TK, unitName, "voz plana con peso", "serious", cierre),
      ],
      dandere: [
        socialVNPage(
          "Palabras pequeñas",
          unitName,
          "manos en la manga",
          "calm",
          "Perdón… " +
            doctorName +
            ". No sé si debo ocupar tu tiempo. Cuando pasás, el ruido del distrito baja un poco, y me da miedo acostumbrarme a ese volumen."
        ),
        socialVNPage(
          "Permiso suave",
          doctorName,
          "sonrisa contenida",
          "calm",
          "Le devuelvo el espacio con calma. " +
            unitName +
            " no necesita performar valentía; necesita que su timidez no sea leída como ausencia. «Seguimos cuando quieras», digo."
        ),
        socialVNPage("Vínculo " + linkLv + " · " + TK, unitName, "valentía mínima, sincera", "calm", cierre),
      ],
      genki: [
        socialVNPage(
          "¡Interceptación!",
          unitName,
          "brillo de adrenalina social",
          "calm",
          "¡" +
            doctorName +
            "! ¡Te agarré antes del ascensor! Tengo tres ideas malas y una buena: la buena es que te quedes aunque sea el tiempo de un café imaginario."
        ),
        socialVNPage(
          "Ritmo compartido",
          doctorName,
          "se deja arrastrar un poco",
          "calm",
          "Me dejo llevar medio metro. " +
            unitName +
            " enciende el pasillo como un neón roto: feo de lejos, hermoso de cerca. «Dale», digo."
        ),
        socialVNPage("Nivel " + linkLv + " · " + TK, unitName, "un segundo serio", "tension", cierre + " Si no podés, decime «no puedo»; no desaparezcas en humo de hospital."),
      ],
    };
    const k = lib[arc] ? arc : "kuudere";
    return lib[k];
  }

  function buildSocialLinkVNIntro(arc, linkLv, unitName, doctorName) {
    const tier = socialLinkTierFromLevel(linkLv);
    return {
      title: "Vínculo social · " + unitName,
      bg: 2,
      vnMood: "calm",
      pages: socialArchetypeIntroPages(arc, tier, linkLv, unitName, doctorName),
    };
  }

  function buildSocialLinkVNOutro(mood, newLv, unitName, partnerGained) {
    const good = mood >= 2;
    const bad = mood <= -2;
    const moodTxt = good ? "La química empuja el vínculo hacia adelante." : bad ? "El aire queda denso; habrá que recomponer otro día." : "Quedó un equilibrio frágil pero honesto.";
    const p2 =
      "Cierras la nota mental: vínculo " +
      newLv +
      "/10 con " +
      unitName +
      "." +
      (partnerGained ? " Pareja de ruta sellada con palabras simples, no con fanfarrias." : "");
    return {
      title: "Después del encuentro",
      bg: 3,
      vnMood: good ? "calm" : bad ? "serious" : "calm",
      pages: [
        socialVNPage("Eco en el pasillo", unitName, good ? "casi una sonrisa" : bad ? "mirada esquiva" : "neutral", good ? "calm" : "serious", moodTxt),
        socialVNPage("Doctor", "Tú", "dedos en el llavero del consultorio", "calm", p2),
      ],
    };
  }

  function openSocialLinkChoicesOverlay(arc, linkLv, unitName, doctorName, portraitSrc, sceneTitle, onMoodDone) {
    const ov = document.getElementById("vnOverlay");
    const txt = document.getElementById("vnText");
    const port = document.getElementById("vnPortrait");
    const choicesEl = document.getElementById("vnChoices");
    const cont = document.getElementById("vnContinue");
    if (!ov || !txt || !choicesEl || !cont) {
      onMoodDone(0);
      return;
    }
    let mood = 0;
    let step = 0;
    function baseChrome() {
      resetVNChrome();
      const bg = VN_BG[2 % VN_BG.length];
      ov.style.backgroundImage = `linear-gradient(180deg,rgba(0,0,0,.55),rgba(0,0,0,.85)), url("${bg}")`;
      port.style.display = "block";
      port.innerHTML = `<img src="${escapeAttrUrl(portraitSrc)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:10px" onerror="this.parentElement.style.display='none'"/>`;
      choicesEl.style.display = "flex";
      cont.style.display = "none";
      ov.classList.add("show");
    }
    function finishChoices() {
      choicesEl.style.display = "none";
      choicesEl.innerHTML = "";
      ov.classList.remove("show");
      cont.onclick = null;
      resetVNChrome();
      onMoodDone(mood);
    }
    function addChoice(label, onPick) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.addEventListener("click", onPick);
      choicesEl.appendChild(b);
    }
    function renderStep() {
      choicesEl.innerHTML = "";
      baseChrome();
      playStoryMood(step === 0 ? "tension" : "calm");
      if (step === 0) {
        txt.innerHTML = `<strong>${escapeHtml(sceneTitle)}</strong><br/><br/>
          <strong class="vn-speaker">${escapeHtml(unitName)}</strong> <span class="muted vn-expression">(arquetipo ${escapeHtml(arc)} · vínculo ${linkLv}/10)</span><br/><br/>
          ${escapeHtml(doctorName)}, elegí el <em>lugar</em> para esta escena social.`;
        addChoice("Cafetería tranquila del hospital (té, silencio útil).", () => {
          mood += 1;
          step++;
          renderStep();
        });
        addChoice("Arcade ruidoso del distrito (luces, ruido blanco).", () => {
          mood -= 1;
          step++;
          renderStep();
        });
      } else if (step === 1) {
        txt.innerHTML = `<strong>${escapeHtml(sceneTitle)}</strong><br/><br/>
          <strong class="vn-speaker">${escapeHtml(unitName)}</strong><br/><br/>
          ¿Hablamos del trabajo en el nudo urbano o dejamos que el tema respire con humor?`;
        addChoice("Serio: riesgos, deber, lo que nadie quiere nombrar.", () => {
          mood += 1;
          step++;
          renderStep();
        });
        addChoice("Ligero: broma, anécdota, cambiar de canal emocional.", () => {
          mood -= 1;
          step++;
          renderStep();
        });
      } else if (step === 2) {
        txt.innerHTML = `<strong>${escapeHtml(sceneTitle)}</strong><br/><br/>
          <strong class="vn-speaker">${escapeHtml(unitName)}</strong><br/><br/>
          ¿Querés gastar un regalo del inventario (❤) para subir la apuesta simbólica?`;
        addChoice("Sí — usar un regalo si hay stock.", () => {
          const gi = lotgState.giftInventory || {};
          const keys = Object.keys(gi).filter((k) => gi[k] > 0);
          if (keys.length) {
            const useK = keys[0];
            gi[useK]--;
            mood += 2;
            lotgState.giftInventory = gi;
          }
          finishChoices();
        });
        addChoice("No — sin regalo físico esta vez.", () => finishChoices());
      }
    }
    renderStep();
  }

  function askSocialPartnerVN(unitName, doctorName, portraitSrc, onYesNo) {
    const ov = document.getElementById("vnOverlay");
    const txt = document.getElementById("vnText");
    const port = document.getElementById("vnPortrait");
    const choicesEl = document.getElementById("vnChoices");
    const cont = document.getElementById("vnContinue");
    if (!ov || !txt || !choicesEl) {
      onYesNo(false);
      return;
    }
    resetVNChrome();
    const bg = VN_BG[3 % VN_BG.length];
    ov.style.backgroundImage = `linear-gradient(180deg,rgba(0,0,0,.55),rgba(0,0,0,.85)), url("${bg}")`;
    port.style.display = "block";
    port.innerHTML = `<img src="${escapeAttrUrl(portraitSrc)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:10px" onerror="this.parentElement.style.display='none'"/>`;
    txt.innerHTML = `<strong>Pareja de ruta</strong><br/><br/>
      <strong class="vn-speaker">${escapeHtml(unitName)}</strong><br/><br/>
      El vínculo llegó a 10/10 con buena química. ¿Preguntás si quiere formalizar la relación (×2 stats en combate)?`;
    choicesEl.style.display = "flex";
    choicesEl.innerHTML = "";
    cont.style.display = "none";
    playStoryMood("tension");
    ov.classList.add("show");
    function pick(yes) {
      choicesEl.style.display = "none";
      choicesEl.innerHTML = "";
      ov.classList.remove("show");
      resetVNChrome();
      onYesNo(yes);
    }
    const b1 = document.createElement("button");
    b1.type = "button";
    b1.textContent = "Sí — formalizar pareja de ruta.";
    b1.addEventListener("click", () => pick(true));
    const b2 = document.createElement("button");
    b2.type = "button";
    b2.textContent = "Mejor dejar la puerta entreabierta.";
    b2.addEventListener("click", () => pick(false));
    choicesEl.appendChild(b1);
    choicesEl.appendChild(b2);
  }

  function runSocialLinkVNFlow(uid, onDone) {
    if (!lotgState) {
      onDone && onDone();
      return;
    }
    migrateLotgState(lotgState);
    normalizeSoulPointsOnState(lotgState);
    if (lotgState.soul < 400) {
      alert("Necesitas 400 Soul Points para un evento social.");
      onDone && onDone();
      return;
    }
    const u = (lotgState.roster || []).find((x) => x && x.uid === uid);
    if (!u) {
      onDone && onDone();
      return;
    }
    lotgState.soul -= 400;
    if (!lotgState.socialLinks[uid]) lotgState.socialLinks[uid] = { level: 0, partner: false };
    const sl = lotgState.socialLinks[uid];
    const L = Math.min(10, Math.max(0, Math.floor(sl.level || 0)));
    const arc = lotgSocialArchetypeForRosterUnit(u);
    const doc = (lotgState.protag && lotgState.protag.name) || "Doctor";
    const imgSrc = u.img || "Char/Lawliet.png";
    const introBeat = buildSocialLinkVNIntro(arc, L, u.name, doc);
    playLotgTrack("youthful", "Youthful");
    showVNSequenceFromBeat(introBeat, () => {
      openSocialLinkChoicesOverlay(arc, L, u.name, doc, imgSrc, introBeat.title || "Vínculo social", (mood) => {
        let dLv = 0;
        if (mood >= 2) dLv = 1;
        else if (mood <= -2) dLv = L <= 1 ? 0 : -1;
        sl.level = Math.min(10, Math.max(0, L + dLv));
        function playOutro(partnerGained) {
          if (mood >= 2) playLotgTrack("youthful", "Youthful");
          else if (mood <= -2) playLotgTrack("pinkun", "Pinkun");
          else playLotgTrack("chill", "Chill out");
          const outro = buildSocialLinkVNOutro(mood, sl.level, u.name, partnerGained);
          showVNSequenceFromBeat(outro, () => {
            playLotgTrack("safe", "Safe Area");
            resetVnStoryMusicState();
            lotgSave();
            onDone && onDone();
          });
        }
        if (sl.level >= 10 && mood >= 2 && !sl.partner) {
          askSocialPartnerVN(u.name, doc, imgSrc, (yes) => {
            if (yes) sl.partner = true;
            lotgState.socialLinks[uid] = sl;
            lotgSave();
            playOutro(!!yes);
          });
        } else {
          lotgState.socialLinks[uid] = sl;
          lotgSave();
          playOutro(false);
        }
      });
    });
  }

  function renderLotgGame(opts) {
    const wrap = document.getElementById("lotgGameWrap");
    if (!lotgState) {
      clearCombatScene();
      return;
    }
    if (!wrap) return;
    try {
    wrap.style.display = "block";
    wrap.classList.remove("lotg-combat-active");
    normalizeSoulPointsOnState(lotgState);
    migrateLotgState(lotgState);
    const p = lotgState.protag;
    if (!p || typeof p !== "object" || !p.stats) {
      console.error("[LOTG] protagonista inválido; reiniciando guardado.");
      lotgWipe();
      wrap.innerHTML = "";
      wrap.style.display = "none";
      const introEl = document.getElementById("lotgIntro");
      if (introEl) introEl.style.display = "block";
      renderLotgCreate();
      alert("La partida guardada no era válida y se borró. Crea un personaje de nuevo (o usa «Borrar partida guardada» si vuelve a pasar).");
      return;
    }
    const cs = applyEquipToProtag();
    if (p.hpCur > cs.hpMax) p.hpCur = cs.hpMax;
    if (p.spCur > cs.spMax) p.spCur = cs.spMax;

    const avatarSrc = p.avatar || "Char/Lawliet.png";
    if (opts && opts.combatBg) wrap.dataset.cbg = opts.combatBg;

    if (inLotgCombat()) {
      const cbg = wrap.dataset.cbg || COMBAT_BG[Math.floor(Math.random() * COMBAT_BG.length)];
      wrap.style.backgroundImage = `linear-gradient(180deg,rgba(6,8,14,.75),rgba(6,8,14,.92)), url("${cbg}")`;
      const allies = getPartyUnits();
      const allyV = lotgState.combatAllyVitals || {};
      const combatHelpTxt = `<p class="smt-combat-help"><strong>Cómo funciona:</strong> primero el doctor (ataque a un enemigo si hay horda; técnica en área); luego cada aliado; después todos los enemigos. <strong>CD</strong> = rondas enemigas: cada vez que <strong>toda la horda</strong> termina de actuar, bajan 1 los enfriamientos y los buffs de equipo/consumibles. <strong>Estados alterados</strong> (silencio, sueño, quemadura, congelación, parálisis) duran <strong>rondas enemigas</strong>; la quemadura hace DoT al empezar la oleada enemiga. <strong>Neutralizador</strong> o <em>Lushen EX</em> limpian estados. <strong>HP máx.</strong> con <strong>HP</strong> y <strong>VI</strong>; <strong>SP</strong> con <strong>SP</strong> y <strong>MA</strong>.</p>`;
      const alliesCombat =
        allies.length > 0
          ? `<div class="smt-wing-caption">Aliados — un turno por unidad; revisa la descripción de cada habilidad antes de usarla.</div><div class="lotg-ally-combat-row smt-ally-strip">` +
            allies
              .map((a) => {
                const v = allyV[a.uid];
                const stA = allyCombatStats(a);
                const hp = v ? v.hp : stA.hpMax;
                const sp = v ? v.sp : stA.spMax;
                const hpPct = stA.hpMax > 0 ? Math.max(0, Math.min(100, (hp / stA.hpMax) * 100)) : 0;
                const spPct = stA.spMax > 0 ? Math.max(0, Math.min(100, (sp / stA.spMax) * 100)) : 0;
                const dead = !v || v.hp <= 0;
                const ailAl =
                  v && formatAilmentsShort(v.ailments)
                    ? `<div class="muted" style="font-size:0.55rem;color:#fca5a5;margin-top:0.12rem;line-height:1.2">${escapeHtml(formatAilmentsShort(v.ailments))}</div>`
                    : "";
                const passTxt = a.passive ? `<div class="muted" style="font-size:0.6rem;margin-top:0.2rem;line-height:1.25">Pasiva: ${escapeHtml(a.passive.name)}</div>` : "";
                const ask = a.skill;
                const skBox =
                  ask && (ask.desc || ask.dmg)
                    ? `<div class="muted" style="font-size:0.58rem;line-height:1.3;margin-top:0.25rem;padding:0.3rem;border-radius:8px;background:rgba(0,0,0,0.2)"><strong>${escapeHtml(ask.name)}</strong>${ask.dmg ? ` · ${escapeHtml(ask.dmg)}` : ""}${
                        ask.desc ? `<br/>${escapeHtml(ask.desc)}` : ""
                      }</div>`
                    : "";
                return `<div class="lotg-ally-combat-card${dead ? " ally-down" : ""}">
                  <img class="unit-face lotg-combat-unit-face" src="${escapeHtml(a.img)}" alt="" onerror="this.style.opacity=0.3"/>
                  <div class="lotg-ally-combat-name">${escapeHtml(a.name)}</div>
                  <div class="muted" style="font-size:0.6rem">${escapeHtml(a.element || "Neutral")}</div>
                  ${ailAl}
                  ${passTxt}
                  ${skBox}
                  <div class="bar-wrap"><div class="bar-fill" style="width:${hpPct}%"></div></div>
                  <div class="muted" style="font-size:0.65rem">HP ${Math.max(0, Math.floor(hp))}/${stA.hpMax} <span style="font-size:0.55rem">(VI↑)</span></div>
                  <div class="bar-wrap"><div class="bar-fill sp" style="width:${spPct}%"></div></div>
                  <div class="muted" style="font-size:0.65rem">SP ${Math.max(0, Math.floor(sp))}/${stA.spMax} <span style="font-size:0.55rem">(maná)</span></div>
                </div>`;
              })
              .join("") +
            `</div>`
          : `<p class="muted" style="font-size:0.78rem;margin:0.25rem 0">Sin aliados en el grupo — configúralos en Exploración.</p>`;
      const isAllyPhase =
        combatPhase === "ally" && allies.length > 0 && combatAllyIndex >= 0 && combatAllyIndex < allies.length;
      const curAlly = isAllyPhase ? allies[combatAllyIndex] : null;
      const curV = curAlly ? allyV[curAlly.uid] : null;
      const sk = curAlly && curAlly.skill;
      const skCost = sk && sk.sp != null ? sk.sp : 16;
      const skCd = curV ? curV.skillCd : 0;
      const silAl = curV && (mergeAilments(curV.ailments).silence || 0) > 0;
      const skillBlocked = !curV || curV.sp < skCost || skCd > 0 || silAl;
      const skBtnText = sk
        ? escapeHtml(sk.name) + " (" + skCost + " SP" + (skCd > 0 ? ", CD " + skCd : "") + ")"
        : "Habilidad";
      const skTip =
        sk && (sk.desc || sk.dmg)
          ? `<div class="muted" style="font-size:0.76rem;margin:0.35rem 0;line-height:1.45;padding:0.45rem 0.55rem;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(0,0,0,0.18)"><strong>${escapeHtml(sk.name)}</strong>${
              sk.dmg ? ` <span class="slot-equip-tag">${escapeHtml(sk.dmg)}</span>` : ""
            }<br/>${escapeHtml(sk.desc || "")}</div>`
          : "";
      const docCombat = "Doctor " + escapeHtml(p.name);
      const invBattle = lotgState.inventory || [];
      const itemPickBlock = combatPickMode && combatPickMode.type === "consumable_target";
      const itemBtns = invBattle
        .map((it, idx) => {
          normalizeInventoryItem(it);
          if (!["heal", "sp", "buff", "cleanse", "stat"].includes(it.type)) return "";
          const dis = combatPickMode && !itemPickBlock ? "disabled" : "";
          return `<button type="button" class="ghost combat-use-item" data-inv-i="${idx}" ${dis} style="text-align:left;font-size:0.76rem;padding:0.45rem 0.55rem;line-height:1.35">
            <strong>${escapeHtml(it.name)}</strong> <span class="slot-equip-tag">[${escapeHtml(it.type)}]</span><br/><span class="muted">${escapeHtml(
            it.desc || ""
          )}</span>
          </button>`;
        })
        .join("");
      const usableCount = invBattle.filter((x) => {
        normalizeInventoryItem(x);
        return ["heal", "sp", "buff", "cleanse", "stat"].includes(x.type);
      }).length;
      let allyBuffBits = "";
      allies.forEach((a) => {
        const v = allyV[a.uid];
        const bt = v && (v.consumableBuffTurns || 0) > 0 && (v.consumableBuffMult || 1) > 1;
        if (bt) {
          allyBuffBits +=
            " · " +
            escapeHtml(a.name) +
            " +" +
            Math.round(((v.consumableBuffMult || 1) - 1) * 100) +
            "% (" +
            (v.consumableBuffTurns || 0) +
            " t.)";
        }
      });
      const buffPill =
        (lotgState.combatBuff && lotgState.combatBuff.turns > 0) || allyBuffBits
          ? `<div class="combat-buff-pill">Buffs — Doctor: ${
              lotgState.combatBuff && lotgState.combatBuff.turns > 0
                ? "+" + Math.round(((lotgState.combatBuff.atkMult || 1) - 1) * 100) + "% (" + lotgState.combatBuff.turns + " t.)"
                : "—"
            }${allyBuffBits}</div><div class="combat-triangle-hint">Triángulo elemental: <strong>Fuego</strong> → <strong>Hielo</strong> → <strong>Trueno</strong> → Fuego (+22% / −18% daño).</div>`
          : `<div class="combat-triangle-hint">Triángulo: Fuego &gt; Hielo &gt; Trueno &gt; Fuego · Imaginario/Luz/etc. = neutro.</div>`;
      const protagAilPill = formatAilmentsShort(lotgState.protagAilments)
        ? `<div class="combat-buff-pill" style="border-color:rgba(248,113,113,0.45);background:rgba(60,20,20,0.25);margin-top:0.35rem;font-size:0.74rem">Estados (doctor): ${escapeHtml(
            formatAilmentsShort(lotgState.protagAilments)
          )}</div>`
        : "";
      const itemPanel =
        !isAllyPhase && usableCount
          ? `<div class="combat-items-wrap"><p class="muted" style="font-size:0.76rem;margin:0.4rem 0 0.35rem"><strong>Objetos</strong> (elige uno; consume el turno):</p><div class="combat-items-grid">${itemBtns}</div></div>`
          : !isAllyPhase
            ? `<p class="muted" style="font-size:0.74rem;margin:0.35rem 0">Sin consumibles usables en inventario.</p>`
            : "";
      const protagPassive = p.passive
        ? `<p class="muted" style="font-size:0.72rem;margin:0.35rem 0;line-height:1.35"><strong>Pasiva:</strong> ${escapeHtml(p.passive.name)} — ${escapeHtml(p.passive.desc)}</p>`
        : "";
      const protagSkillTip =
        p.skillActive && (p.skillActive.desc || p.skillActive.name)
          ? `<div class="muted" style="font-size:0.76rem;margin:0.35rem 0;line-height:1.45;padding:0.45rem 0.55rem;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(0,0,0,0.18)"><strong>${escapeHtml(
              p.skillActive.name || "Técnica"
            )}</strong> <span class="slot-equip-tag">(área · 18 SP · CD 3)</span><br/>${escapeHtml(p.skillActive.desc || "")}</div>`
          : "";
      const ultName = p.skillActive && p.skillActive.name ? escapeHtml(p.skillActive.name) : "Grúa clínica";
      if (!lotgState.protagExtraSkillCd || typeof lotgState.protagExtraSkillCd !== "object") lotgState.protagExtraSkillCd = {};
      const protagActivesHtml = (() => {
        const ids = (lotgState.equippedSkillsProtag || []).slice(0, 4);
        const parts = [];
        ids.forEach((bid) => {
          const sk = getLotgBattleSkill(bid);
          if (!sk || !sk.combat || sk.combat.kind === "passive") return;
          const cd = lotgState.protagExtraSkillCd[bid] || 0;
          const spc = sk.combat.sp != null ? sk.combat.sp : 0;
          const cdc = sk.combat.cd != null ? sk.combat.cd : 0;
          const dis = combatPickMode || cd > 0 || p.spCur < spc;
          parts.push(
            `<button type="button" class="ghost" data-act="lotgextra:${escapeHtml(bid)}" style="font-size:0.7rem;max-width:100%;text-align:left;line-height:1.25"${
              dis ? " disabled" : ""
            }>${escapeHtml(sk.name)} · ${spc} SP · CD ${cdc}${cd > 0 ? " · enfriamiento " + cd + " ronda(s)" : ""}</button>`
          );
        });
        return parts.length
          ? `<div style="margin:0.45rem 0"><div class="muted" style="font-size:0.7rem;margin-bottom:0.25rem"><strong>Técnicas equipadas</strong> (máx. 4 en perfil)</div><div class="btn-row" style="flex-wrap:wrap;gap:0.35rem;align-items:stretch">${parts.join(
              ""
            )}</div></div>`
          : "";
      })();
      const curAllyLotgHtml =
        isAllyPhase && curAlly && curV
          ? (() => {
              if (!curV.extraSkillCd) curV.extraSkillCd = {};
              const ids = (curAlly.equippedSkills || []).slice(0, 4);
              const parts = [];
              ids.forEach((bid) => {
                const sk = getLotgBattleSkill(bid);
                if (!sk || !sk.combat || sk.combat.kind === "passive") return;
                const cd = curV.extraSkillCd[bid] || 0;
                const spc = sk.combat.sp != null ? sk.combat.sp : 0;
                const cdc = sk.combat.cd != null ? sk.combat.cd : 0;
                const disA = combatPickMode || cd > 0 || curV.sp < spc;
                parts.push(
                  `<button type="button" class="ghost" data-ally-act="allylotg:${escapeHtml(bid)}" style="font-size:0.68rem;max-width:100%;text-align:left;line-height:1.25"${
                    disA ? " disabled" : ""
                  }>${escapeHtml(sk.name)} · ${spc} SP · CD ${cdc}${cd > 0 ? " · enfriamiento " + cd + " ronda(s)" : ""}</button>`
                );
              });
              return parts.length
                ? `<div style="margin:0.35rem 0"><div class="muted" style="font-size:0.65rem">Técnicas de ${escapeHtml(curAlly.name)}</div><div class="btn-row" style="flex-wrap:wrap;gap:0.3rem">${parts.join(
                    ""
                  )}</div></div>`
                : "";
            })()
          : "";
      const wantPickEnemy =
        combatPickMode &&
        combatPickMode.type !== "consumable_target" &&
        (combatPickMode.type === "protag_atk" ||
          combatPickMode.type === "ally_atk" ||
          combatPickMode.type === "ally_skill_enemy" ||
          combatPickMode.type === "lotg_skill_enemy" ||
          combatPickMode.type === "lotg_ally_skill_enemy");
      const invPick = combatPickMode && combatPickMode.type === "consumable_target" ? combatPickMode.invIdx : -1;
      const invPickIt =
        invPick >= 0 && invPick < invBattle.length ? invBattle[invPick] : null;
      if (invPickIt) normalizeInventoryItem(invPickIt);
      const consumableTargetRow =
        combatPickMode && combatPickMode.type === "consumable_target" && invPickIt
          ? `<div class="combat-consumable-target-box" style="margin:0.5rem 0;padding:0.5rem;border-radius:10px;border:1px solid rgba(250,204,21,0.45);background:rgba(60,50,10,0.35);font-size:0.8rem;line-height:1.45">
          <strong>¿Quién recibe «${escapeHtml(invPickIt.name)}»?</strong>
          <div class="btn-row" style="margin-top:0.45rem;flex-wrap:wrap">
            <button type="button" class="primary combat-consume-target" data-consume-target="protag">${docCombat}</button>
            ${allies
              .map((a) => {
                const v = allyV[a.uid];
                const dead = !v || v.hp <= 0;
                return `<button type="button" class="ghost combat-consume-target" ${dead ? "disabled" : ""} data-consume-target="${escapeHtml(a.uid)}">${escapeHtml(a.name)}</button>`;
              })
              .join("")}
            <button type="button" class="ghost combat-cancel-pick" style="font-size:0.78rem">Cancelar</button>
          </div>
        </div>`
          : "";
      const pickBanner = combatPickMode
        ? `<div class="combat-pick-banner" style="margin:0.5rem 0;padding:0.55rem 0.7rem;border-radius:10px;border:1px solid rgba(96,165,250,0.45);background:rgba(59,130,246,0.12);font-size:0.82rem;line-height:1.45">
          ${
            combatPickMode.type === "consumable_target"
              ? "<strong>Elige objetivo</strong> del consumible (abajo)."
              : combatPickMode.type === "ally_skill_ally" ||
                  combatPickMode.type === "lotg_skill_ally" ||
                  combatPickMode.type === "lotg_ally_skill_ally"
                ? "<strong>Elige aliado o doctor</strong> para aplicar la habilidad."
                : "<strong>Elige enemigo</strong> en la horda (clic en su tarjeta)."
          }
          ${
            combatPickMode.type === "consumable_target"
              ? ""
              : '<button type="button" class="ghost combat-cancel-pick" style="margin-left:0.5rem;font-size:0.78rem">Cancelar</button>'
          }
        </div>`
        : "";
      const enemiesCol = `<div class="lotg-enemy-hord-wrap smt-enemy-stack"><p class="smt-enemy-sub">${combatEnemies.filter((x) => x.hp > 0).length} enemigo(s) activo(s)</p>${combatEnemies
        .map((en, ei) => {
          const es = en.stats || emptyStats();
          const down = en.hp <= 0;
          const pct = en.hpMax > 0 ? Math.max(0, Math.min(100, (en.hp / en.hpMax) * 100)) : 0;
          const pickCls = wantPickEnemy && !down ? " combat-pickable-enemy" : "";
          const pickAttr = wantPickEnemy && !down ? ` data-combat-pick-enemy="${ei}"` : "";
          const enAil = formatAilmentsShort(en.ailments);
          return `<div class="lotg-enemy-card${down ? " enemy-down" : ""}${pickCls}"${pickAttr} style="${wantPickEnemy && !down ? "cursor:pointer;box-shadow:0 0 0 1px rgba(96,165,250,0.35)" : ""}">
            <strong>${escapeHtml(en.name)}</strong> <span class="muted">(${escapeHtml(en.tag)})</span> · <span class="lotg-elem-tag">${escapeHtml(en.element || "Neutral")}</span>
            ${en.boss ? ' <span class="rarity-SSS">JEFE</span>' : ""}${en.miniboss ? ' <span class="rarity-S">MINI</span>' : ""}
            ${enAil ? `<div class="muted" style="font-size:0.65rem;color:#93c5fd;margin-top:0.2rem">${escapeHtml(enAil)}</div>` : ""}
            <div class="bar-wrap"><div class="bar-fill" style="width:${pct}%"></div></div>
            <div class="muted" style="font-size:0.72rem">HP ${Math.max(0, Math.floor(en.hp))}/${en.hpMax} · Nv.${en.level}</div>
            <div class="muted" style="font-size:0.68rem;line-height:1.3;margin-top:0.25rem">STG ${es.STG} · DX ${es.DX} · MA ${es.MA} · EN ${es.EN} · AG ${es.AG}</div>
          </div>`;
        })
        .join("")}</div>`;
      const allyPickRow =
        combatPickMode &&
        (combatPickMode.type === "ally_skill_ally" ||
          combatPickMode.type === "lotg_skill_ally" ||
          combatPickMode.type === "lotg_ally_skill_ally")
          ? `<div class="combat-ally-pick-row" style="margin:0.5rem 0"><p class="muted" style="font-size:0.78rem;margin:0 0 0.35rem">Objetivo de apoyo / curación:</p><div class="btn-row" style="flex-wrap:wrap">
          <button type="button" class="primary" data-combat-pick-ally="protag">${docCombat}</button>
          ${allies
            .map((a) => {
              const v = allyV[a.uid];
              const dead = !v || v.hp <= 0;
              return `<button type="button" class="ghost" ${dead ? "disabled" : ""} data-combat-pick-ally="${escapeHtml(a.uid)}">${escapeHtml(a.name)}</button>`;
            })
            .join("")}
        </div></div>`
          : "";
      const actionBlock = isAllyPhase
        ? `<div class="combat-phase-banner ally-turn"><strong>Turno de aliado:</strong> ${escapeHtml(curAlly.name)}</div>
        ${pickBanner}
        ${skTip}
        <div class="btn-row">
          <button type="button" class="primary" data-ally-act="atk" ${combatPickMode ? "disabled" : ""}>Atacar</button>
          <button type="button" class="ghost" data-ally-act="skill" ${skillBlocked || combatPickMode ? "disabled" : ""}>${skBtnText}</button>
          <button type="button" class="ghost" data-ally-act="pass" ${combatPickMode ? "disabled" : ""}>Esperar</button>
        </div>
        ${curAllyLotgHtml}`
        : `<div class="combat-phase-banner protag-turn"><strong>Turno de ${docCombat}</strong> — luego aliados; cada enemigo actúa en la horda.</div>
        ${pickBanner}
        ${consumableTargetRow}
        ${buffPill}
        ${protagAilPill}
        ${protagPassive}
        <div class="btn-row">
          <button type="button" class="primary" data-act="atk" ${combatPickMode ? "disabled" : ""}>Ataque físico (elige enemigo si hay horda)</button>
          <button type="button" class="ghost" data-act="skill" ${combatPickMode ? "disabled" : ""}>${ultName} — área (18 SP, CD 3)</button>
          <button type="button" class="ghost danger" data-act="flee" ${combatPickMode ? "disabled" : ""}>Huir</button>
        </div>
        ${protagSkillTip}
        ${protagActivesHtml}
        ${itemPanel}`;
      wrap.classList.add("lotg-combat-active");
      wrap.innerHTML = `
        <div class="smt-combat-shell">
          <header class="smt-combat-header">
            <div class="smt-combat-header-bar">
              <span class="smt-combat-venue">FIELD — ANOMALY</span>
              <h2 class="smt-combat-h1">COMBATE <span class="smt-floor-tag">Piso ${lotgState.floor}</span></h2>
            </div>
            ${combatHelpTxt}
          </header>
          <div class="smt-combat-grid">
            <aside class="smt-wing smt-wing--allies">
              <h3 class="smt-wing-title smt-wing-title--cyan">ALIADOS</h3>
              ${alliesCombat}
            </aside>
            <section class="smt-wing smt-wing--foes">
              <h3 class="smt-wing-title smt-wing-title--magenta">ENEMIGOS / HORDA</h3>
              ${enemiesCol}
            </section>
            <aside class="smt-wing smt-wing--commander">
              <h3 class="smt-wing-title smt-wing-title--gold">COMANDANTE</h3>
              <div class="smt-protag-card lotg-combat-protag-wrap">
                <img class="lotg-protag-portrait-combat smt-protag-portrait" src="${escapeAttrUrl(avatarSrc)}" alt="" data-lotg-combat-portrait="1" />
                <div class="smt-protag-id"><strong>${escapeHtml(p.name)}</strong></div>
                <div class="smt-protag-meta">Lv.${p.level} · ${escapeHtml(p.lotgElement || "Imaginario")}</div>
                <div class="bar-wrap smt-bar"><div class="bar-fill" style="width:${(p.hpCur / cs.hpMax) * 100}%"></div></div>
                <div class="smt-stat-line">HP ${p.hpCur}/${cs.hpMax}</div>
                <div class="bar-wrap smt-bar"><div class="bar-fill sp" style="width:${(p.spCur / cs.spMax) * 100}%"></div></div>
                <div class="smt-stat-line">SP ${p.spCur}/${cs.spMax}</div>
              </div>
              <div class="smt-action-deck-commander smt-action-deck">${actionBlock}</div>
            </aside>
          </div>
          <footer class="smt-combat-footer">
            <div class="combat-log smt-combat-log">${escapeHtml(combatLog.join("\n"))}</div>
            ${allyPickRow}
          </footer>
        </div>`;
      wrap.querySelectorAll(".combat-cancel-pick").forEach((b) => {
        b.addEventListener("click", () => {
          if (combatPhase === "player") combatTurn("cancel-pick");
          else allyCombatTurn("cancel-pick");
        });
      });
      wrap.querySelectorAll(".combat-consume-target").forEach((b) => {
        b.addEventListener("click", () => {
          if (b.disabled) return;
          handleCombatConsumableTarget(b.getAttribute("data-consume-target"));
        });
      });
      wrap.querySelectorAll("[data-combat-pick-enemy]").forEach((el) => {
        el.addEventListener("click", () => {
          const idx = parseInt(el.getAttribute("data-combat-pick-enemy"), 10);
          if (!Number.isFinite(idx)) return;
          handleCombatEnemyPick(idx);
        });
      });
      wrap.querySelectorAll("[data-combat-pick-ally]").forEach((el) => {
        el.addEventListener("click", () => {
          if (el.disabled) return;
          handleCombatAllyPick(el.getAttribute("data-combat-pick-ally"));
        });
      });
      wrap.querySelectorAll("[data-act]").forEach((b) => {
        b.addEventListener("click", () => combatTurn(b.getAttribute("data-act")));
      });
      wrap.querySelectorAll(".combat-use-item").forEach((b) => {
        b.addEventListener("click", () => combatTurnItem(parseInt(b.getAttribute("data-inv-i"), 10)));
      });
      wrap.querySelectorAll("[data-ally-act]").forEach((b) => {
        b.addEventListener("click", () => allyCombatTurn(b.getAttribute("data-ally-act")));
      });
      const combatPortrait = wrap.querySelector("img[data-lotg-combat-portrait]");
      if (combatPortrait) {
        combatPortrait.addEventListener("error", function lotgCombatPf() {
          combatPortrait.removeEventListener("error", lotgCombatPf);
          combatPortrait.src = LOTG_COMBAT_PROTAG_FALLBACK_DATA_URL;
        });
      }
      return;
    }

    const hubBgIdx = (Math.max(0, (lotgState.floor || 1) - 1) + (lotgState.combatsCleared || 0)) % LOTG_HUB_BACKGROUNDS.length;
    const hubBgUrl = LOTG_HUB_BACKGROUNDS[hubBgIdx];
    wrap.style.backgroundImage = `linear-gradient(180deg,rgba(10,12,22,.91),rgba(8,10,18,.94)), url("${hubBgUrl}")`;
    wrap.style.backgroundSize = "cover";
    wrap.style.backgroundPosition = "center";
    wrap.style.backgroundAttachment = "local";
    if (!lotgState.lotgView) lotgState.lotgView = "hub";
    const tab = lotgState.lotgView;

    function subnavHtml() {
      const v = tab;
      return `<nav class="lotg-subnav">
        <button type="button" data-lotg-tab="hub" class="${v === "hub" ? "on" : ""}">Exploración</button>
        <button type="button" data-lotg-tab="gacha" class="${v === "gacha" ? "on" : ""}">Reclutamiento</button>
        <button type="button" data-lotg-tab="abilities" class="${v === "abilities" ? "on" : ""}">Habilidades</button>
        <button type="button" data-lotg-tab="social_links" class="${v === "social_links" ? "on" : ""}">Vínculos</button>
        <button type="button" data-lotg-tab="story" class="${v === "story" ? "on" : ""}">Historia</button>
      </nav>`;
    }

    const sp = getSoulPoints();
    const currencyBar = `<div class="lotg-currency-bar">
      <span><strong>Zen:</strong> ${lotgState.zen}</span>
      <span class="lotg-soul-pill" title="Soul Points — para reclutar en el gacha">✦ Soul Points: ${sp}</span>
      <span><strong>Piso:</strong> ${lotgState.floor}</span>
    </div>`;

    function attachHubCommon() {
      bindLotgSubnav(wrap);
      const btnSaveLotg = document.getElementById("btnSaveLotg");
      if (btnSaveLotg) {
        btnSaveLotg.addEventListener("click", () => {
        lotgSave();
        alert("Partida guardada.");
      });
      }
      const btnAbandon = document.getElementById("btnAbandon");
      if (btnAbandon) {
        btnAbandon.addEventListener("click", () => {
        if (!confirm("¿Abandonar run y borrar progreso no guardado?")) return;
        lotgWipe();
        wrap.innerHTML = "";
        wrap.style.display = "none";
        document.getElementById("lotgIntro").style.display = "block";
        renderLotgCreate();
        playGlobalClinic();
      });
      }
    }

    /** Solo nodos dentro de #lotgGameWrap — nunca el catálogo Patimon ni el resto de la página. */
    function bindEquipLists() {
      if (!wrap || !lotgState) return;
      if (!Array.isArray(lotgState.partyUids)) lotgState.partyUids = [];
      if (!lotgState.equipSlots || typeof lotgState.equipSlots !== "object") lotgState.equipSlots = {};
      const protagSlots = lotgState.equipSlots;
      wrap.querySelectorAll(".inv-equip-go").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (inLotgCombat()) {
            alert("No puedes cambiar el equipo durante el combate.");
            return;
          }
          const idx = parseInt(btn.getAttribute("data-stash-idx"), 10);
          const li = btn.closest("li");
          const sel = li ? li.querySelector("select.inv-equip-target") : null;
          const dest = sel && sel.value ? sel.value : "protag";
          if (applyEquipPieceFromStashToTarget(idx, dest)) {
            lotgSave();
            renderLotgGame();
          }
        });
      });
      wrap.querySelectorAll("[data-unequip-slot]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (inLotgCombat()) {
            alert("No puedes cambiar el equipo durante el combate.");
            return;
          }
          const sl = btn.getAttribute("data-unequip-slot");
          if (!EQUIP_SLOTS.includes(sl)) return;
          const piece = protagSlots[sl];
          if (!piece) return;
          protagSlots[sl] = null;
          if (!lotgState.gearStash) lotgState.gearStash = [];
          lotgState.gearStash.push(piece);
          lotgSave();
          renderLotgGame();
        });
      });
      wrap.querySelectorAll("[data-party-add]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (inLotgCombat()) {
            alert("No puedes cambiar el grupo durante el combate.");
            return;
          }
          const uid = btn.getAttribute("data-party-add");
          if (!uid || lotgState.partyUids.includes(uid)) return;
          if (lotgState.partyUids.length >= MAX_PARTY_ALLIES) {
            alert("Máximo " + MAX_PARTY_ALLIES + " aliados en combate.");
            return;
          }
          lotgState.partyUids.push(uid);
          lotgSave();
          renderLotgGame();
        });
      });
      wrap.querySelectorAll("[data-party-rem]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (inLotgCombat()) {
            alert("No puedes cambiar el grupo durante el combate.");
            return;
          }
          const uid = btn.getAttribute("data-party-rem");
          lotgState.partyUids = (lotgState.partyUids || []).filter((id) => id !== uid);
          lotgSave();
          renderLotgGame();
        });
      });
      wrap.querySelectorAll(".ally-uneq").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (inLotgCombat()) {
            alert("No puedes cambiar el equipo durante el combate.");
            return;
          }
          const uid = btn.getAttribute("data-au");
          const sl = btn.getAttribute("data-asl");
          const u = (lotgState.roster || []).find((x) => x && x.uid === uid);
          if (!u || !EQUIP_SLOTS.includes(sl)) return;
          if (!u.equipSlots || typeof u.equipSlots !== "object") u.equipSlots = {};
          const piece = u.equipSlots[sl];
          if (!piece) return;
          u.equipSlots[sl] = null;
          if (!lotgState.gearStash) lotgState.gearStash = [];
          lotgState.gearStash.push(piece);
          lotgSave();
          renderLotgGame();
        });
      });
      wrap.querySelectorAll(".lotg-use-consumable").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (inLotgCombat()) return;
          const idx = parseInt(btn.getAttribute("data-inv-use"), 10);
          if (Number.isNaN(idx)) return;
          lotgState._consumablePickIdx = idx;
          renderLotgGame();
        });
      });
      wrap.querySelectorAll(".lotg-hub-consumable-target").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.getAttribute("data-hub-inv"), 10);
          const tgt = btn.getAttribute("data-hub-target");
          if (Number.isNaN(idx) || !tgt) return;
          useConsumableOutsideCombat(idx, tgt);
        });
      });
      wrap.querySelectorAll(".lotg-hub-consumable-cancel").forEach((btn) => {
        btn.addEventListener("click", () => {
          lotgState._consumablePickIdx = null;
          renderLotgGame();
        });
      });
    }

    function runGacha(premium, times) {
      const gr = document.getElementById("gachaResult");
      normalizeSoulPointsOnState(lotgState);
      const { cost1, cost10 } = gachaCosts(premium);
      const cost = times === 10 ? cost10 : cost1 * times;
      const have = getSoulPoints();
      if (have < cost) {
        if (gr) {
          gr.textContent =
            "Necesitas " +
            cost +
            " Soul Points para esta tirada. Tienes " +
            have +
            ". Gana Soul venciendo enemigos (más si el peligro es alto) o revisa que tu partida cargue bien.";
        }
        return;
      }
      lotgState.soul = have - cost;
      if (!Array.isArray(lotgState.gachaLog)) lotgState.gachaLog = [];
      const stamp = new Date().toLocaleString();
      const banner = (premium ? "Premium" : "Común") + " ×" + times;
      const lines = [];
      const logBlock = ["── " + stamp + " · " + banner + " ──"];
      for (let t = 0; t < times; t++) {
        if (Math.random() < (premium ? 0.78 : 0.72)) {
          const eq = randomEquipItem(premium);
          if (!lotgState.gearStash) lotgState.gearStash = [];
          lotgState.gearStash.push(eq);
          const bEq = formatEquipBonusLine(eq);
          const ln =
            "Equipo → " + eq.name + " [" + (eq.equipSlot || "?") + "]" + (bEq ? " · " + bEq : "") + " → almacén";
          lines.push(ln);
          logBlock.push("  · " + ln);
        } else {
          const r = addOrMergeUnit(pickUnit(premium));
          let ln;
          if (r.merged) ln = "Fusión: " + r.name + " → +" + r.rank + "/" + MAX_MERGE_RANK;
          else if (r.refund) ln = "Copia extra (fusión máx.) → +" + r.zen + " Zen";
          else {
            const urec = (lotgState.roster || []).find((x) => x.name === r.name);
            const el = urec && urec.element ? " · " + urec.element : "";
            const ps = urec && urec.passive ? " · Pasiva: " + urec.passive.name : "";
            ln = "Unidad: " + r.name + " [" + r.rarity + "]" + el + ps;
          }
          lines.push(ln);
          logBlock.push("  · " + ln);
        }
      }
      lotgState.gachaLog = logBlock.concat(lotgState.gachaLog);
      if (lotgState.gachaLog.length > 100) lotgState.gachaLog.length = 100;
      if (gr) gr.textContent = lines.join(" · ");
      lotgSave();
      renderLotgGame();
    }

    function runAbilityGacha(times) {
      const gr = document.getElementById("gachaResult");
      const cost1 = 900;
      const cost10 = 3000;
      const cost = times === 10 ? cost10 : cost1 * times;
      normalizeSoulPointsOnState(lotgState);
      const have = getSoulPoints();
      if (have < cost) {
        if (gr) gr.textContent = "Necesitas " + cost + " SP para técnicas ×" + times + ". Tienes " + have + ".";
        return;
      }
      lotgState.soul = have - cost;
      if (!Array.isArray(lotgState.ownedSkillIds)) lotgState.ownedSkillIds = [];
      if (!Array.isArray(lotgState.gachaLog)) lotgState.gachaLog = [];
      const stamp = new Date().toLocaleString();
      const lines = [];
      const logBlock = ["── " + stamp + " · Gacha técnicas ×" + times + " ──"];
      for (let t = 0; t < times; t++) {
        const sk = pickRandomAbilityFromGacha();
        if (!sk) break;
        if (!lotgState.ownedSkillIds.includes(sk.id)) lotgState.ownedSkillIds.push(sk.id);
        const ln = "Técnica: " + sk.name + " [" + sk.rarity + "]";
        lines.push(ln);
        logBlock.push("  · " + ln);
      }
      lotgState.gachaLog = logBlock.concat(lotgState.gachaLog);
      if (lotgState.gachaLog.length > 100) lotgState.gachaLog.length = 100;
      if (gr) gr.textContent = lines.join(" · ");
      lotgSave();
      renderLotgGame();
    }

    function refreshSideQuestFloorProg() {
      if (!lotgState || !Array.isArray(lotgState.activeSideQuests)) return;
      const f = lotgState.floor || 1;
      lotgState.activeSideQuests.forEach((q) => {
        if (q.kind === "floor" && f >= (q.need || 99)) q.prog = q.need;
      });
    }

    function runSocialLinkSession(uid) {
      runSocialLinkVNFlow(uid, () => renderLotgGame());
    }

    if (tab === "abilities") {
      migrateLotgState(lotgState);
      const owned = (lotgState.ownedSkillIds || []).filter((id) => getLotgBattleSkill(id));
      const eqP = (lotgState.equippedSkillsProtag || []).slice(0, 4);
      const docName = (lotgState.protag && lotgState.protag.name) || "Doctor";
      const ownerLabel = (ow, unitUid) => {
        if (!ow) return "";
        if (ow === "protag") return " → " + escapeHtml(docName);
        const un = (lotgState.roster || []).find((u) => u.uid === ow);
        return " → " + escapeHtml((un && un.name) || "recluta");
      };
      const ownedOpts =
        owned.length === 0
          ? "<p class='muted'>Sin técnicas en colección. Gacha de habilidades o tienda ◆ en el mapa.</p>"
          : owned
              .map((id) => {
                const sk = getLotgBattleSkill(id);
                if (!sk) return "";
                const ow = lotgSkillGlobalOwner(lotgState, id);
                const onP = ow === "protag";
                const dis = ow && ow !== "protag";
                return `<label style="display:block;margin:0.45rem 0;font-size:0.82rem;line-height:1.45;opacity:${dis ? "0.55" : "1"}">
          <input type="checkbox" class="lotg-eq-pro" value="${escapeHtml(id)}" ${onP ? "checked" : ""} ${dis ? "disabled" : ""} />
          <strong>${escapeHtml(sk.name)}</strong> <span class="slot-equip-tag">${escapeHtml(sk.rarity)}</span>${
            ow && !onP ? `<span class="muted"> (en uso${ownerLabel(ow)})</span>` : ""
          }<br/><span class="muted">${escapeHtml(sk.desc)}</span>
        </label>`;
              })
              .join("");
      const rosterEq = (lotgState.roster || [])
        .map((unit) => {
          const eq = (unit.equippedSkills || []).slice(0, 4);
          const opts =
            owned.length === 0
              ? "<span class='muted'>Sin técnicas para equipar.</span>"
              : owned
                  .map((id) => {
                    const sk = getLotgBattleSkill(id);
                    if (!sk) return "";
                    const ow = lotgSkillGlobalOwner(lotgState, id);
                    const on = ow === unit.uid;
                    const dis = ow && ow !== unit.uid;
                    return `<label style="display:inline-flex;align-items:flex-start;gap:0.35rem;margin:0.25rem 0.6rem 0 0;font-size:0.76rem;line-height:1.35;max-width:100%;opacity:${
                      dis ? "0.55" : "1"
                    }">
              <input type="checkbox" class="lotg-eq-unit" data-uid="${escapeHtml(unit.uid)}" value="${escapeHtml(id)}" ${
                on ? "checked" : ""
              } ${dis ? "disabled" : ""} />
              <span>${escapeHtml(sk.name)} <span class="slot-equip-tag">${escapeHtml(sk.rarity)}</span>${
                ow && !on ? `<span class="muted" style="font-size:0.65rem"> (en uso${ownerLabel(ow)})</span>` : ""
              }</span>
            </label>`;
                  })
                  .join("");
          return `<div style="margin:0.85rem 0;padding:0.55rem;border-radius:10px;border:1px solid rgba(255,255,255,0.08)"><strong>${escapeHtml(
            unit.name
          )}</strong> — máx. 4 técnicas; <span class="muted">cada técnica solo en un personaje a la vez</span><div style="margin-top:0.4rem;display:flex;flex-wrap:wrap;align-items:flex-start">${opts}</div></div>`;
        })
        .join("");
      wrap.innerHTML =
        subnavHtml() +
        currencyBar +
        `<h2 style="margin-top:0">Habilidades equipables</h2>
        <p class="muted">Hasta <strong>4</strong> por personaje. <strong>Cada técnica solo puede llevarla una unidad</strong> (doctor o un recluta): prioridad al guardar — doctor primero, luego el orden del roster. Pasivas alteran stats; activas en combate. Los CD bajan <strong>una vez por oleada enemiga</strong>.</p>
        <h3>Doctor</h3>
        <div class="card" style="padding:0.75rem;margin:0.5rem 0">${ownedOpts}</div>
        <h3>Reclutas</h3>
        ${rosterEq || "<p class='muted'>Sin reclutas.</p>"}
        <div class="btn-row" style="margin-top:1rem">
          <button type="button" class="primary" id="lotgSaveEquipSkills">Guardar equipamiento</button>
        </div>`;
      attachHubCommon();
      const btnS = document.getElementById("lotgSaveEquipSkills");
      if (btnS) {
        btnS.addEventListener("click", () => {
          const proIds = [];
          wrap.querySelectorAll(".lotg-eq-pro:checked").forEach((x) => {
            if (proIds.length < 4) proIds.push(x.value);
          });
          lotgState.equippedSkillsProtag = proIds;
          (lotgState.roster || []).forEach((unit) => {
            const nu = [];
            wrap.querySelectorAll(".lotg-eq-unit:checked").forEach((x) => {
              if (x.getAttribute("data-uid") !== unit.uid) return;
              if (nu.length < 4) nu.push(x.value);
            });
            unit.equippedSkills = nu;
          });
          lotgMigrateExclusiveSkills(lotgState);
          lotgSave();
          alert("Equipamiento guardado (técnicas duplicadas se resolvieron a una sola unidad).");
          renderLotgGame();
        });
      }
      return;
    }

    if (tab === "social_links") {
      refreshSideQuestFloorProg();
      migrateLotgState(lotgState);
      const quests = (lotgState.activeSideQuests || [])
        .map((q, qi) => {
          const done = (q.prog || 0) >= (q.need || 1);
          return `<li style="margin:0.5rem 0;padding:0.5rem;border-radius:8px;border:1px solid rgba(255,255,255,0.08)">
            <strong>${escapeHtml(q.title || q.tid)}</strong> — ${q.prog || 0}/${q.need || 0}
            ${done ? `<button type="button" class="primary lotg-quest-turn" data-qi="${qi}" style="margin-left:0.5rem;font-size:0.8rem">Entregar</button>` : ""}
          </li>`;
        })
        .join("");
      const rosterOpts = (lotgState.roster || [])
        .map(
          (unit) =>
            `<option value="${escapeHtml(unit.uid)}">${escapeHtml(unit.name)} — vínculo ${Math.min(
              10,
              (lotgState.socialLinks[unit.uid] && lotgState.socialLinks[unit.uid].level) || 0
            )}/10</option>`
        )
        .join("");
      wrap.innerHTML =
        subnavHtml() +
        currencyBar +
        `<h2 style="margin-top:0">Vínculos sociales y misiones</h2>
        <p class="muted">Evento social: <strong>400 SP</strong>. Se abre el <strong>overlay visual novel</strong> con texto largo según nivel de vínculo y arquetipo (tsundere / kuudere / dandere / genki). Música: Youthful / Chill / Pinkun. Regalos en ❤ del mapa.</p>
        <div class="card" style="padding:0.75rem;margin:0.75rem 0">
          <label class="muted" style="font-size:0.85rem">Unidad</label><br/>
          <select id="lotgSocialUnit" style="min-width:12rem;margin:0.35rem 0">${rosterOpts || "<option value=''>—</option>"}</select>
          <div class="btn-row" style="margin-top:0.5rem">
            <button type="button" class="primary" id="lotgSocialGo" ${rosterOpts ? "" : "disabled"}>Iniciar evento (400 SP)</button>
          </div>
        </div>
        <h3>Misiones secundarias activas</h3>
        <ul style="list-style:none;padding:0;margin:0">${quests || "<li class='muted'>No hay misiones. Visita 📜 en el mapa.</li>"}</ul>`;
      attachHubCommon();
      const go = document.getElementById("lotgSocialGo");
      const sel = document.getElementById("lotgSocialUnit");
      if (go && sel) {
        go.addEventListener("click", () => {
          const uid = sel.value;
          if (!uid) return;
          runSocialLinkSession(uid);
        });
      }
      wrap.querySelectorAll(".lotg-quest-turn").forEach((b) => {
        b.addEventListener("click", () => {
          const qi = parseInt(b.getAttribute("data-qi"), 10);
          const q = (lotgState.activeSideQuests || [])[qi];
          if (!q || (q.prog || 0) < (q.need || 1)) return;
          const rew = q.reward || {};
          if (rew.zen) lotgState.zen += rew.zen;
          if (rew.soul) {
            normalizeSoulPointsOnState(lotgState);
            lotgState.soul += rew.soul;
          }
          if (!Array.isArray(lotgState.completedQuestIds)) lotgState.completedQuestIds = [];
          lotgState.completedQuestIds.push(q.tid);
          lotgState.activeSideQuests.splice(qi, 1);
          lotgSave();
          alert(
            "Misión completada.\n\nEl NPC te agradece por la ayuda.\nRecompensa: " +
              (rew.zen ? "+" + rew.zen + " Zen " : "") +
              (rew.soul ? "+" + rew.soul + " Soul" : "")
          );
          renderLotgGame();
        });
      });
      return;
    }

    if (tab === "gacha") {
      const bcf = lotgState.bannerCommonFour;
      if (!bcf || bcf.length !== 4 || !bcf[0] || typeof bcf[0].img !== "string") {
        lotgState.bannerCommonFour = pickCommonBannerFour();
      }
      const four = lotgState.bannerCommonFour;
      const bannerCells = four
        .map(
          (entry) => `
        <div class="gacha-banner-face">
          <img src="${escapeHtml(entry.img)}" alt="${escapeHtml(entry.name)}" loading="lazy" onerror="this.style.opacity=0.35" />
          <span class="gacha-banner-name">${escapeHtml(entry.name)}</span>
        </div>`
        )
        .join("");
      wrap.innerHTML =
        subnavHtml() +
        currencyBar +
        `<h2 style="margin-top:0">Centro de reclutamiento</h2>
        <p class="muted">Los <strong>Soul Points</strong> suben más al vencer enemigos. El gacha prioriza <strong>equipo</strong> frente a unidades (menor tasa de reclutas). Banner común: 4 destacadas al azar.</p>
        ${buildGachaRecruitmentCatalogHtml()}
        <div class="gacha-two-col">
          <div class="gacha-panel">
            <h3>Gacha común</h3>
            <p class="muted" style="margin-top:0">Pool A–S; <strong>~28% chance de unidad</strong> por tirada (resto equipo). ×1: <strong>700</strong> SP · ×10: <strong>1600</strong> SP.</p>
            <div class="gacha-common-banner">${bannerCells}</div>
            <p class="gacha-common-pool-names"><strong>Pool de reclutas:</strong> ${commonPoolRecruitNamesHtml()}</p>
            <div class="btn-row">
              <button type="button" class="primary" id="gachaC1">Común ×1 (700)</button>
              <button type="button" class="primary" id="gachaC10">Común ×10 (1600)</button>
            </div>
          </div>
          <div class="gacha-panel gacha-panel-premium" style="border-color:rgba(255,110,199,0.4)">
            <h3>Gacha premium</h3>
            <p class="muted" style="margin-top:0">Mesa superior. <strong>1%</strong> de chance de unidad SSS promocional (${GACHA_UNITS.filter((u) => u.promo)
              .map((u) => escapeHtml(u.name))
              .join(" · ") || "—"}).</p>
            <div class="gacha-premium-hero">
              <p class="gacha-premo-eyebrow">Destacado premium</p>
              <h2 class="gacha-premo-title">Unidades SSS del banner</h2>
              <p class="gacha-premo-tagline">La voluntad despierta bajo el nudo…</p>
            </div>
            <div class="gacha-premium-art gacha-premium-promo-row" style="display:flex;flex-wrap:wrap;gap:0.75rem;justify-content:center;align-items:flex-start">
              ${GACHA_UNITS.filter((u) => u.promo)
                .map(
                  (u) =>
                    `<div class="gacha-promo-unit-card" style="text-align:center;max-width:min(200px,46%)">
                <img src="${escapeAttrUrl(u.img)}" alt="${escapeHtml(u.name)}" loading="lazy" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;border:2px solid rgba(255,110,199,0.45)" onerror="this.style.opacity=0.35" />
                <div class="muted" style="font-size:0.75rem;margin-top:0.35rem;line-height:1.25">${escapeHtml(u.name)}</div>
              </div>`
                )
                .join("")}
            </div>
            <p class="gacha-premo-grade">Rango SSS · Unidad promocional · tirada premium</p>
            <p class="muted" style="margin-top:0.75rem"><strong>~22% unidad</strong> por tirada (resto equipo). ×1: <strong>870</strong> SP · ×10: <strong>2500</strong> SP.</p>
            <div class="btn-row">
              <button type="button" class="ghost" id="gachaP1">Premium ×1 (870)</button>
              <button type="button" class="ghost" id="gachaP10">Premium ×10 (2500)</button>
            </div>
          </div>
        </div>
        <div class="gacha-panel" style="margin-top:1.25rem;border-color:rgba(147,197,253,0.5);background:rgba(25,40,60,0.25)">
          <h3>Gacha de técnicas (A–SSS)</h3>
          <p class="muted" style="margin-top:0">Solo <strong>técnicas equipables</strong> para combate (inventario de habilidades). ×1: <strong>900</strong> SP · ×10: <strong>3000</strong> SP.</p>
          <div class="btn-row">
            <button type="button" class="primary" id="gachaA1">Técnicas ×1 (900)</button>
            <button type="button" class="primary" id="gachaA10">Técnicas ×10 (3000)</button>
          </div>
        </div>
        <p class="muted" id="gachaResult" style="margin-top:1rem"></p>
        <h3 style="margin-top:1.25rem;font-size:1rem">Registro de tiradas</h3>
        <div class="gacha-pull-log" id="gachaPullLog"></div>`;
      const pullLog = document.getElementById("gachaPullLog");
      if (pullLog) {
        const gl = lotgState.gachaLog || [];
        pullLog.innerHTML = gl.length
          ? "<ul class='gacha-log-list'>" + gl.map((l) => "<li>" + escapeHtml(l) + "</li>").join("") + "</ul>"
          : "<p class='muted' style='margin:0'>Sin tiradas registradas aún.</p>";
      }
      attachHubCommon();
      const gachaC1 = document.getElementById("gachaC1");
      if (gachaC1) gachaC1.addEventListener("click", () => runGacha(false, 1));
      const gachaC10 = document.getElementById("gachaC10");
      if (gachaC10) gachaC10.addEventListener("click", () => runGacha(false, 10));
      const gachaP1 = document.getElementById("gachaP1");
      if (gachaP1) gachaP1.addEventListener("click", () => runGacha(true, 1));
      const gachaP10 = document.getElementById("gachaP10");
      if (gachaP10) gachaP10.addEventListener("click", () => runGacha(true, 10));
      const gachaA1 = document.getElementById("gachaA1");
      if (gachaA1) gachaA1.addEventListener("click", () => runAbilityGacha(1));
      const gachaA10 = document.getElementById("gachaA10");
      if (gachaA10) gachaA10.addEventListener("click", () => runAbilityGacha(10));
      bindGachaCatalogUi(wrap.querySelector(".gacha-recruit-showcase"));
      return;
    }

    if (tab === "story") {
      const listHtml = STORY_CHAPTERS.map((ch) => {
        const ok = storyChapterUnlocked(ch);
        let req =
          ch.unlockFloor <= 0
            ? "Disponible desde el inicio"
            : `Piso ${ch.unlockFloor}+ en Exploración`;
        if (ch.requiresRosterMin != null) {
          req += ` · ≥${ch.requiresRosterMin} recluta(s) en roster`;
        }
        return `<li class="${ok ? "" : "locked"}">
          <div>
            <strong>${escapeHtml(ch.title)}</strong>
            <div class="muted" style="font-size:0.8rem">${escapeHtml(req)}</div>
          </div>
          <button type="button" class="primary" data-story-read="${escapeHtml(ch.id)}" ${ok ? "" : "disabled"} style="opacity:${ok ? 1 : 0.5}">Leer</button>
        </li>`;
      }).join("");
      wrap.innerHTML =
        subnavHtml() +
        currencyBar +
        `<h2 style="margin-top:0">Modo historia</h2>
        <p class="muted">Prólogo en varias pantallas. <strong>Interludio</strong> (piso 3+): escenas previas y diálogo con la unidad fija del capítulo (<strong>Aozora Lin</strong> por defecto; arte del catálogo aunque aún no la tengas en roster). Capítulos en pisos 5, 10, 15 y 20. Las elecciones quedan registradas.</p>
        <ul class="story-chapter-list">${listHtml}</ul>
        <details class="story-skill-codex" style="margin-top:1.25rem">
          <summary><strong>Referencia breve — habilidades de unidades</strong> (reclutamiento)</summary>
          <ul style="margin:0.75rem 0 0;padding-left:1.2rem;font-size:0.88rem;line-height:1.5">
            ${GACHA_UNITS.map((u) => {
              const ps = u.passive ? " · Pasiva: " + escapeHtml(u.passive.name) : "";
              return `<li><strong>${escapeHtml(u.name)}</strong> (${escapeHtml(u.element || "")})${ps} — <em>${escapeHtml((u.skill && u.skill.name) || "—")}</em>: ${escapeHtml(
                (u.skill && u.skill.desc) || ""
              )}</li>`;
            }).join("")}
          </ul>
        </details>`;
      attachHubCommon();
      wrap.querySelectorAll("[data-story-read]").forEach((btn) => {
        if (btn.disabled) return;
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-story-read");
          const ch = STORY_CHAPTERS.find((c) => c.id === id);
          if (!ch) return;
          const done = () => {
            playLotgTrack("safe", "Safe Area");
            resetVnStoryMusicState();
            renderLotgGame();
          };
          resetVnStoryMusicState();
          if (ch.type === "choice") runChoiceAllyChapter(ch, done);
          else if (ch.pages && ch.pages.length) showVNSequenceFromBeat(ch, done);
          else showVN(ch, done);
        });
      });
      return;
    }

    refreshSideQuestFloorProg();
    const fr = lotgState.floorAdvanceRule || "free";
    const floorExitHint =
      fr === "boss"
        ? "<br/><span class=\"muted\" style=\"font-size:0.8rem\">Este piso exige <strong>vencer al jefe</strong> (casilla <strong>💀</strong>) antes de usar la salida ⇊.</span>"
        : fr === "key"
          ? "<br/><span class=\"muted\" style=\"font-size:0.8rem\">Este piso exige encontrar la <strong>llave</strong> en eventos (?) para poder bajar por ⇊.</span>"
          : fr === "relic"
            ? "<br/><span class=\"muted\" style=\"font-size:0.8rem\">Este piso exige recuperar la <strong>reliquia</strong> en eventos (?) antes de ⇊.</span>"
            : "";
    const mapHtml = `
      <h3>Exploración — mini mapa</h3>
      <p class="muted">Avanza a celdas <strong>adyacentes</strong>. <strong>Cada piso</strong> el sector se <strong>reordena al azar</strong> (combates, tiendas, eventos y salida). Las celdas <strong class="lotg-done-inline">moradas</strong> ya se completaron. <strong>Salida ⇊</strong> no se marca en morado. Jefe cada <strong>3 pisos</strong> (💀). Combate en <strong>horda</strong>.</p>
      ${floorExitHint}
      <p class="muted" style="font-size:0.8rem">⚔ combate · 💀 jefe · ? evento · ¤ tienda · ◆ tienda habilidades (Soul) · ❤ regalos · 📜 misión NPC · ♥ descanso · ⇊ salida</p>
      <div class="lotg-map" id="lotgMap"></div>`;

    const rosterUnits = Array.isArray(lotgState.roster) ? lotgState.roster : [];
    const rosterHtml =
      `<h3>Unidades reclutadas (${rosterUnits.length}) — grupo activo: ${getPartyUnits().length}/${MAX_PARTY_ALLIES}</h3><p class="muted" style="font-size:0.85rem">Los reclutas ganan <strong>EXP</strong> al vencer combates: suben de nivel solos y reparten stats según su rol. Cada uno tiene <strong>equipo</strong> y combate por turnos. Duplicados se <strong>fusionan</strong> (hasta ${MAX_MERGE_RANK}). Fuera de combate conservan HP/SP entre batallas; <strong>♥ descanso</strong> los cura.</p><div class="flex lotg-roster-grid">` +
      rosterUnits
        .map((u) => {
          const inP = (lotgState.partyUids || []).includes(u.uid);
          const mergeB =
            (u.mergeRank || 0) > 0 ? ` <span class="merge-badge">Fusión ${u.mergeRank}/${MAX_MERGE_RANK}</span>` : "";
          const canAdd = !inP && (lotgState.partyUids || []).length < MAX_PARTY_ALLIES;
          const ustats = u.stats && typeof u.stats === "object" ? u.stats : emptyStats();
          const statMini = STAT_KEYS.map((k) => `<span>${k} <strong>${ustats[k] || 0}</strong></span>`).join(" · ");
          const stFight = allyCombatStats(u);
          const uxNeed = unitXpThreshold(u.level);
          const ux = u.xp != null && Number.isFinite(u.xp) ? u.xp : 0;
          const pv0 = (lotgState.partyVitalsPersist || {})[u.uid];
          const hx =
            inP && pv0 && typeof pv0.hp === "number"
              ? Math.max(0, Math.min(stFight.hpMax, Math.floor(pv0.hp)))
              : stFight.hpMax;
          const sx =
            inP && pv0 && typeof pv0.sp === "number"
              ? Math.max(0, Math.min(stFight.spMax, Math.floor(pv0.sp)))
              : stFight.spMax;
          const uSlots = u.equipSlots && typeof u.equipSlots === "object" ? u.equipSlots : {};
          const slotsEq = EQUIP_SLOTS.map((sl) => {
            const eq = uSlots[sl];
            if (eq) {
              const bl = formatEquipBonusLine(eq);
              return `<div class="ally-slot-line"><strong>${escapeHtml(sl)}</strong>: ${escapeHtml(eq.name)}${bl ? ` <span class="muted">(${escapeHtml(bl)})</span>` : ""} <button type="button" class="ghost danger ally-uneq" data-au="${escapeHtml(
                u.uid
              )}" data-asl="${escapeHtml(sl)}" style="font-size:0.65rem;padding:0.1rem 0.35rem">Quitar</button></div>`;
            }
            return `<div class="ally-slot-line muted"><strong>${escapeHtml(sl)}</strong>: vacío</div>`;
          }).join("");
          return `
        <div class="lotg-roster-card">
          <img class="unit-face" src="${escapeHtml(u.img)}" alt="" onerror="this.style.background='#333'"/>
          <div style="font-size:0.8rem"><span class="rarity-${u.rarity}">${escapeHtml(u.rarity)}</span> ${escapeHtml(u.name)}${mergeB}</div>
          <div class="muted" style="font-size:0.72rem">${escapeHtml(u.element)} · ${escapeHtml(u.role)} · Lv.${u.level} · EXP ${ux}/${uxNeed}</div>
          <div class="lotg-roster-stats muted">${statMini}</div>
          <div class="muted" style="font-size:0.68rem;line-height:1.35;margin-top:0.25rem">Máx. combate (stats + equipo): <strong>HP ${stFight.hpMax}</strong> · <strong>SP ${stFight.spMax}</strong> · ATK ${stFight.atkP}/${stFight.atkM}</div>
          ${
            inP
              ? `<div class="muted" style="font-size:0.65rem;line-height:1.3;margin-top:0.2rem">En el mapa: HP ${hx}/${stFight.hpMax} · SP ${sx}/${stFight.spMax}</div>`
              : ""
          }
          <div class="muted" style="font-size:0.72rem;line-height:1.4;margin-top:0.35rem"><strong>Activa:</strong> ${escapeHtml((u.skill && u.skill.name) || "—")}${u.skill && u.skill.dmg ? ` <span class="slot-equip-tag">${escapeHtml(u.skill.dmg)}</span>` : ""} — ${escapeHtml((u.skill && u.skill.desc) || "")}</div>
          ${u.passive ? `<div class="muted" style="font-size:0.68rem;line-height:1.35;margin-top:0.25rem"><strong>Pasiva:</strong> ${escapeHtml(u.passive.name)} — ${escapeHtml(u.passive.desc)}</div>` : ""}
          ${inP ? '<span class="party-badge party-badge-active">En combate</span>' : ""}
          <div class="btn-row" style="margin-top:0.4rem">
            <button type="button" class="ghost" data-party-add="${escapeHtml(u.uid)}" style="padding:0.25rem 0.5rem;font-size:0.75rem" ${canAdd ? "" : "disabled"}>+ Grupo</button>
            <button type="button" class="ghost danger" data-party-rem="${escapeHtml(u.uid)}" style="padding:0.25rem 0.5rem;font-size:0.75rem" ${inP ? "" : "disabled"}>− Quitar</button>
          </div>
          <div class="ally-equip-block">
            <div class="muted" style="font-size:0.72rem;margin:0.5rem 0 0.25rem"><strong>Equipo del recluta</strong> (quita con el botón; vuelve al inventario de piezas)</div>
            <div style="font-size:0.72rem;line-height:1.45">${slotsEq}</div>
            <div class="muted" style="font-size:0.68rem;margin-top:0.35rem">Para equipar piezas nuevas, usa <strong>Inventario — piezas de equipo</strong> y elige esta unidad como destino.</div>
          </div>
        </div>`;
        })
        .join("") +
      `</div>`;

    const stash = lotgState.gearStash || [];
    const docHub = "Doctor " + escapeHtml(p.name);
    const pickIdx0 = lotgState._consumablePickIdx;
    const pickIt0 =
      pickIdx0 != null && pickIdx0 >= 0 && pickIdx0 < (lotgState.inventory || []).length
        ? (lotgState.inventory || [])[pickIdx0]
        : null;
    let hubConsumablePick = "";
    if (pickIt0) {
      normalizeInventoryItem(pickIt0);
      if (!["heal", "sp", "buff", "cleanse", "stat"].includes(pickIt0.type)) {
        lotgState._consumablePickIdx = null;
      } else {
        hubConsumablePick =
          `<div class="card" style="padding:0.75rem;margin:0.75rem 0;border-color:rgba(34,211,238,0.35)"><p style="margin:0 0 0.5rem;font-size:0.88rem"><strong>¿Quién recibe «${escapeHtml(
            pickIt0.name
          )}»?</strong></p><div class="btn-row" style="flex-wrap:wrap">
          <button type="button" class="primary lotg-hub-consumable-target" data-hub-inv="${pickIdx0}" data-hub-target="protag">${docHub}</button>
          ${(lotgState.roster || [])
            .map(
              (u) =>
                `<button type="button" class="ghost lotg-hub-consumable-target" data-hub-inv="${pickIdx0}" data-hub-target="${escapeHtml(u.uid)}">${escapeHtml(u.name)}</button>`
            )
            .join("")}
          <button type="button" class="ghost lotg-hub-consumable-cancel">Cancelar</button>
        </div></div>`;
      }
    }
    const invHtml =
      `<h3>Inventario — consumibles</h3>
      <p class="muted" style="font-size:0.82rem">Puedes <strong>usar</strong> curas, SP y buffs aquí (exploración) o en combate desde el panel de objetos. Primero pulsa <strong>Usar</strong> y luego elige doctor o recluta.</p>
      <ul id="lotgInvConsumables" style="margin:0;padding-left:0;list-style:none;font-size:0.88rem;line-height:1.45">` +
      (lotgState.inventory || [])
        .map((i, idx) => {
          normalizeInventoryItem(i);
          const usable = ["heal", "sp", "buff", "cleanse", "stat"].includes(i.type);
          const useBtn = usable
            ? ` <button type="button" class="ghost lotg-use-consumable" data-inv-use="${idx}" style="font-size:0.75rem;padding:0.2rem 0.45rem;vertical-align:middle">Usar</button>`
            : "";
          return `<li style="margin-bottom:0.5rem;padding:0.45rem 0;border-bottom:1px solid rgba(255,255,255,0.06)"><strong>${escapeHtml(i.name)}</strong>${useBtn}<br/><span class="muted">${escapeHtml(i.desc || "")}</span></li>`;
        })
        .join("") +
      (!(lotgState.inventory || []).length ? "<li class='muted'>Vacío</li>" : "") +
      `</ul>` +
      hubConsumablePick;

    const stashHtml =
      `<h3>Inventario — piezas de equipo</h3>
      <p class="muted" style="font-size:0.82rem">Elige <strong>destino</strong> (${docHub} o un recluta) y equipa. Las piezas del set base u otras se pueden quitar siempre desde las ranuras.</p>` +
      (stash.length
        ? `<ul id="stashList" style="margin:0;padding-left:0;list-style:none;font-size:0.88rem">${stash
            .map((i, idx) => {
              const sl = i.equipSlot && EQUIP_SLOTS.includes(i.equipSlot) ? i.equipSlot : "Cuerpo";
              const stL = formatEquipBonusLine(i);
              return `<li style="margin-bottom:0.65rem;padding:0.55rem;border-radius:10px;border:1px solid rgba(255,255,255,0.08)">
            <div style="margin-bottom:0.4rem">${escapeHtml(i.name)} <span class="slot-equip-tag">[${escapeHtml(sl)}]</span>${stL ? `<div class="muted" style="font-size:0.76rem;margin-top:0.25rem">${escapeHtml(stL)}</div>` : ""}</div>
            <div style="display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center">
              <span class="muted" style="font-size:0.78rem">Equipar en:</span>
              <select class="inv-equip-target" data-stash-idx="${idx}" style="max-width:14rem;font-size:0.82rem">
                <option value="protag">${docHub}</option>
                ${(lotgState.roster || [])
                  .map((u) => `<option value="${escapeHtml(u.uid)}">${escapeHtml(u.name)}</option>`)
                  .join("")}
              </select>
              <button type="button" class="ghost inv-equip-go" data-stash-idx="${idx}" style="font-size:0.8rem">Equipar</button>
            </div>
          </li>`;
            })
            .join("")}</ul>`
        : `<p class="muted">Nada en el inventario de piezas.</p>`);

    const eqHtml =
      `<h3>Equipo puesto — ${docHub}</h3><ul style="list-style:none;padding-left:0;margin:0;font-size:0.9rem">` +
      EQUIP_SLOTS.map((sl) => {
        const eq = lotgState.equipSlots[sl];
        if (!eq)
          return `<li style="margin-bottom:0.4rem"><strong>${escapeHtml(sl)}:</strong> <span class="muted">vacío</span></li>`;
        const pbl = formatEquipBonusLine(eq);
        return `<li style="margin-bottom:0.45rem;display:flex;flex-wrap:wrap;align-items:center;gap:0.5rem;justify-content:space-between">
          <span><strong>${escapeHtml(sl)}</strong> · ${escapeHtml(eq.name)}${pbl ? `<br/><span class="muted" style="font-size:0.78rem">${escapeHtml(pbl)}</span>` : ""}</span>
          <button type="button" class="ghost danger" data-unequip-slot="${escapeHtml(sl)}" style="padding:0.25rem 0.55rem;font-size:0.8rem">Quitar</button>
        </li>`;
      }).join("") +
      `</ul>`;

    const statDist =
      p.statPoints > 0
        ? `<div class="card" style="padding:1rem;margin:1rem 0"><strong>Sube de nivel:</strong> reparte ${p.statPoints} puntos.<div class="lotg-stats-create" id="protStatAdd"></div><button type="button" class="primary" id="btnApplyStatPoints">Aplicar</button></div>`
        : "";

    const protagCard = `<div class="lotg-protagonist-card">
      <img class="lotg-protag-portrait" src="${escapeAttrUrl(avatarSrc)}" alt="" loading="lazy" data-lotg-hub-portrait="1" />
      <div class="lotg-protag-meta">
        <p class="lotg-protag-name">${escapeHtml(p.name)}</p>
        <p class="lotg-protag-sub">${docHub} en la exploración · Nivel ${p.level} · Piso ${lotgState.floor} · ${escapeHtml(p.lotgElement || "Imaginario")}</p>
        ${p.passive ? `<p class="muted" style="font-size:0.78rem;margin:0.35rem 0;line-height:1.4"><strong>Pasiva:</strong> ${escapeHtml(p.passive.name)} — ${escapeHtml(p.passive.desc)}</p>` : ""}
        ${p.skillActive ? `<p class="muted" style="font-size:0.78rem;margin:0;line-height:1.4"><strong>Técnica:</strong> ${escapeHtml(p.skillActive.name)} — ${escapeHtml(p.skillActive.desc)}</p>` : ""}
        <div class="lotg-protag-bars">
          <p class="muted" style="font-size:0.72rem;margin:0 0 0.35rem;line-height:1.35">Stats de combate con equipo: <strong>ATK</strong> ${cs.atkP}/${cs.atkM} · <strong>HP máx.</strong> sube con HP y <strong>VI</strong> · <strong>SP</strong> es maná (sube con SP y <strong>MA</strong>).</p>
          <div class="bar-wrap"><div class="bar-fill" style="width:${(p.hpCur / cs.hpMax) * 100}%"></div></div>
          <div class="muted" style="font-size:0.75rem">HP ${p.hpCur} / ${cs.hpMax} <span style="font-size:0.65rem">(vitalidad)</span></div>
          <div class="bar-wrap" style="margin-top:0.35rem"><div class="bar-fill sp" style="width:${(p.spCur / cs.spMax) * 100}%"></div></div>
          <div class="muted" style="font-size:0.75rem">SP ${p.spCur} / ${cs.spMax} <span style="font-size:0.65rem">(maná)</span></div>
        </div>
      </div>
    </div>`;

    wrap.innerHTML =
      subnavHtml() +
      currencyBar +
      protagCard +
      `<h2 style="margin-top:0">Exploración — Piso ${lotgState.floor}</h2>
      ${statDist}
      <div class="btn-row">
        <button type="button" class="ghost" id="btnSaveLotg">Guardar partida</button>
        <button type="button" class="ghost danger" id="btnAbandon">Abandonar run</button>
      </div>
      <p class="muted">Combate, tiendas y curación: solo desde el <strong>mapa</strong>. Gacha e historia: pestañas superiores. Soul inicial <strong>${INITIAL_SOUL}</strong>.</p>
      ${mapHtml}
      ${rosterHtml}
      ${invHtml}
      ${stashHtml}
      ${eqHtml}`;

    const hubPortrait = wrap.querySelector("img[data-lotg-hub-portrait]");
    if (hubPortrait) {
      hubPortrait.addEventListener("error", function lotgHubPf() {
        hubPortrait.removeEventListener("error", lotgHubPf);
        hubPortrait.src = LOTG_PROTAG_FALLBACK_DATA_URL;
      });
    }

    attachHubCommon();
    bindEquipLists();

    if (p.statPoints > 0) {
      const pw = document.getElementById("protStatAdd");
      if (pw) {
        STAT_KEYS.forEach((k) => {
          const d = document.createElement("div");
          d.innerHTML = `<label>+${k}</label><input type="number" min="0" max="${p.statPoints}" value="0" data-add="${k}" />`;
          pw.appendChild(d);
        });
        const btnApplyStatPoints = document.getElementById("btnApplyStatPoints");
        if (btnApplyStatPoints) {
          btnApplyStatPoints.addEventListener("click", () => {
          let sum = 0;
          const add = {};
          STAT_KEYS.forEach((k) => {
            const v = parseInt(pw.querySelector(`[data-add="${k}"]`).value, 10) || 0;
            add[k] = v;
            sum += v;
          });
          if (sum !== p.statPoints) {
            alert("Debes repartir exactamente " + p.statPoints + " puntos.");
            return;
          }
          STAT_KEYS.forEach((k) => (p.stats[k] += add[k]));
          p.statPoints = 0;
          const ncs = applyEquipToProtag();
          p.hpCur = Math.min(ncs.hpMax, p.hpCur + Math.floor(ncs.hpMax * 0.15));
          lotgSave();
          renderLotgGame();
        });
        }
      }
    }

    buildMiniMap();
    } catch (e) {
      console.error("[LOTG — renderLotgGame]", e);
      wrap.style.backgroundImage = "";
      wrap.innerHTML =
        '<div style="padding:1.25rem;line-height:1.5">' +
        '<p style="margin:0 0 0.75rem;color:var(--danger)"><strong>Error al mostrar la partida</strong></p>' +
        '<p class="muted" style="margin:0 0 1rem;font-size:0.85rem;white-space:pre-wrap;word-break:break-word">' +
        escapeHtml(String(e && e.message ? e.message : e)) +
        "</p>" +
        '<div class="btn-row"><button type="button" class="primary" id="lotgRenderRetry">Reintentar</button> ' +
        '<button type="button" class="ghost danger" id="lotgRenderWipe">Borrar guardado y volver al menú</button></div></div>';
      const btnRetry = document.getElementById("lotgRenderRetry");
      if (btnRetry) {
        btnRetry.addEventListener("click", function () {
          try {
            renderLotgGame(opts);
          } catch (e2) {
            console.error(e2);
          }
        });
      }
      const btnWipe = document.getElementById("lotgRenderWipe");
      if (btnWipe) {
        btnWipe.addEventListener("click", function () {
          lotgWipe();
          wrap.innerHTML = "";
          wrap.style.display = "none";
          const intro = document.getElementById("lotgIntro");
          if (intro) intro.style.display = "block";
          renderLotgCreate();
          playGlobalClinic();
        });
      }
    }
  }

  function runRoguelikeMapEvent(cellKey) {
    if (Math.random() < 0.16) {
      openAnomalyShop(cellKey);
      return "";
    }
    let msg = "";
    const roll = Math.random();
    if (roll < 0.14) {
      const z = 95 + Math.floor(Math.random() * 200);
      lotgState.zen += z;
      msg = "Recolectas chatarra y datos vendibles: +" + z + " Zen.";
    } else if (roll < 0.26) {
      const s = 58 + Math.floor(Math.random() * 120);
      normalizeSoulPointsOnState(lotgState);
      lotgState.soul += s;
      msg = "Ecos de alma condensados en el Nudo: +" + s + " Soul Points.";
    } else if (roll < 0.34) {
      lotgState.inventory.push({
        type: "heal",
        name: "Kit de vendajes del sector",
        healPct: 0.38,
        desc: "Restaura ≈38% HP (combate o exploración).",
      });
      msg = "Puesto médico abandonado: kit de vendajes (consumible).";
    } else if (roll < 0.4) {
      lotgState.inventory.push({
        type: "buff",
        name: "Inyector de adrenalina urbana",
        atkPct: 0.16,
        turns: 3,
        desc: "+16% daño del equipo durante 3 turnos propios en combate.",
      });
      msg = "Caja táctica sellada: inyector de adrenalina (consumible).";
    } else if (roll < 0.46) {
      lotgState.inventory.push({
        type: "sp",
        name: "Jarabe de sintetizador",
        spPct: 0.36,
        desc: "Restaura ≈36% SP máximo.",
      });
      msg = "Laboratorio improvisado: jarabe de sintetizador (consumible).";
    } else if (roll < 0.52) {
      const ok = confirm(
        "Mercenario herido\n\n" +
          "Aceptar: pagas 90 Zen y recibes una pieza de equipo aleatoria.\n" +
          "Cancelar: sigues de largo (nada)."
      );
      if (ok) {
        if (lotgState.zen >= 90) {
          lotgState.zen -= 90;
          if (!lotgState.gearStash) lotgState.gearStash = [];
          lotgState.gearStash.push(randomEquipItem());
          msg = "Pagas 90 Zen. El mercenario te entrega equipo urbano.";
        } else {
          msg = "No tienes 90 Zen. Te niega el trato.";
        }
      } else {
        msg = "No negocias. Continúas sin cambios.";
      }
    } else if (roll < 0.58) {
      const ok = confirm(
        "Reliquia pulsante\n\n" +
          "Aceptar: absorbes el eco (+190 Soul) pero el doctor pierde ~15% HP actual.\n" +
          "Cancelar: destruyes el objeto con cuidado (+75 Zen, sin riesgo)."
      );
      if (ok) {
        normalizeSoulPointsOnState(lotgState);
        lotgState.soul += 190;
        const csR = applyEquipToProtag();
        lotgState.protag.hpCur = Math.max(1, Math.floor(lotgState.protag.hpCur - csR.hpMax * 0.15));
        msg = "Absorbes el eco: +190 Soul. El vínculo te desgasta (~15% HP).";
      } else {
        lotgState.zen += 75;
        msg = "Destruyes la reliquia con precaución: +75 Zen.";
      }
    } else if (roll < 0.64) {
      const ok = confirm(
        "Terminal de datos robados\n\n" +
          "Aceptar: hackeo arriesgado → 50% +170 Zen / 50% alarma (−28% HP doctor).\n" +
          "Cancelar: extracción segura (+40 Zen)."
      );
      if (ok) {
        if (Math.random() < 0.5) {
          lotgState.zen += 170;
          msg = "Hackeo limpio: +170 Zen.";
        } else {
          const csT = applyEquipToProtag();
          lotgState.protag.hpCur = Math.max(1, Math.floor(lotgState.protag.hpCur - csT.hpMax * 0.28));
          msg = "¡Alarma del sistema! Huyes herido: pierdes ~28% HP; sin Zen extra.";
        }
      } else {
        lotgState.zen += 40;
        msg = "Extracción mínima: +40 Zen.";
      }
    } else if (roll < 0.72) {
      const csF = applyEquipToProtag();
      if (!lotgState.partyVitalsPersist) lotgState.partyVitalsPersist = {};
      lotgState.protag.hpCur = Math.min(csF.hpMax, Math.floor(lotgState.protag.hpCur + csF.hpMax * 0.2));
      lotgState.protag.spCur = Math.min(csF.spMax, Math.floor(lotgState.protag.spCur + csF.spMax * 0.22));
      getPartyUnits().forEach((u) => {
        const st = allyCombatStats(u);
        let pv = lotgState.partyVitalsPersist[u.uid] || { hp: st.hpMax, sp: st.spMax };
        pv.hp = Math.min(st.hpMax, Math.floor(pv.hp + st.hpMax * 0.2));
        pv.sp = Math.min(st.spMax, Math.floor(pv.sp + st.spMax * 0.22));
        lotgState.partyVitalsPersist[u.uid] = pv;
      });
      msg = "Fuente de Ether estable: doctor y aliados en grupo recuperan HP y SP.";
    } else if (roll < 0.78) {
      const ok = confirm(
        "Cofre oxidado con candado biológico\n\n" +
          "Aceptar: forzar → 55% +130 Soul / 45% gas tóxico (−18% HP doctor).\n" +
          "Cancelar: dejarlo (+25 Zen por no arriesgar)."
      );
      if (ok) {
        if (Math.random() < 0.55) {
          normalizeSoulPointsOnState(lotgState);
          lotgState.soul += 130;
          msg = "El candado cede: +130 Soul.";
        } else {
          const csC = applyEquipToProtag();
          lotgState.protag.hpCur = Math.max(1, Math.floor(lotgState.protag.hpCur - csC.hpMax * 0.18));
          msg = "Gas residual: toses sangre (~18% HP). El cofre queda inútil.";
        }
      } else {
        lotgState.zen += 25;
        msg = "No tocas el cofre: encuentras monedas sueltas (+25 Zen).";
      }
    } else if (roll < 0.84) {
      const ok = confirm(
        "Puesto de trueque fantasma\n\n" +
          "Aceptar: cambias 120 Soul por un consumible aleatorio útil.\n" +
          "Cancelar: te marchas."
      );
      if (ok) {
        normalizeSoulPointsOnState(lotgState);
        if (lotgState.soul >= 120) {
          lotgState.soul -= 120;
          const pick = Math.random();
          if (pick < 0.34) {
            lotgState.inventory.push({
              type: "heal",
              name: "Suero de calle 9",
              healPct: 0.42,
              desc: "≈42% HP máximo.",
            });
            msg = "Intercambio: −120 Soul por suero de calle 9.";
          } else if (pick < 0.67) {
            lotgState.inventory.push({ type: "sp", name: "Célula de éter comprimido", spPct: 0.4, desc: "≈40% SP." });
            msg = "Intercambio: −120 Soul por célula de éter comprimido.";
          } else {
            lotgState.inventory.push({
              type: "buff",
              name: "Modulador de daño",
              atkPct: 0.18,
              turns: 4,
              desc: "+18% daño durante 4 turnos propios.",
            });
            msg = "Intercambio: −120 Soul por modulador de daño.";
          }
        } else {
          msg = "No tienes 120 Soul. El puesto se desvanece.";
        }
      } else {
        msg = "Prefieres conservar tu Soul.";
      }
    } else {
      const ok = confirm(
        "Conducto de Ether inestable\n\n" +
          "Aceptar: inyectar al equipo → +14% daño en las próximas 2 batallas.\n" +
          "Cancelar: sellar el conducto → curas al doctor un 22% del HP máx. ahora."
      );
      if (ok) {
        lotgState.runCombatAtkMult = Math.max(lotgState.runCombatAtkMult || 1, 1.14);
        lotgState.runCombatAtkFights = (lotgState.runCombatAtkFights || 0) + 2;
        msg = "Inyección aceptada: buff de daño +14% en las próximas 2 peleas.";
      } else {
        const cs2 = applyEquipToProtag();
        lotgState.protag.hpCur = Math.min(cs2.hpMax, Math.floor(lotgState.protag.hpCur + cs2.hpMax * 0.22));
        msg = "Conducto sellado: doctor recupera ~22% HP.";
      }
    }
    if (lotgState.floorAdvanceRule === "key" && !lotgState.floorExitKey && Math.random() < 0.44) {
      lotgState.floorExitKey = true;
      msg = (msg ? msg + "\n\n" : "") + "Encuentras la llave maestra del sector (puedes usar la salida ⇊ si corresponde).";
    }
    if (lotgState.floorAdvanceRule === "relic" && !lotgState.floorRelicFound && Math.random() < 0.44) {
      lotgState.floorRelicFound = true;
      msg = (msg ? msg + "\n\n" : "") + "Recuperas la reliquia de registro del piso.";
    }
    if (!lotgState.mapCellDone) lotgState.mapCellDone = {};
    lotgState.mapCellDone[cellKey] = true;
    return msg;
  }

  function shuffleArrayLotg(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  /** Mapa 5×5 nuevo por piso: posición de salida, combates, tiendas, etc. aleatorias (roguelike). */
  function randomizeLotgFloorLayout() {
    if (!lotgState) return;
    if (!lotgState.mapCellTypes) lotgState.mapCellTypes = {};
    if (!lotgState.mapCellMeta) lotgState.mapCellMeta = {};
    const allKeys = [];
    for (let yy = 0; yy < 5; yy++) {
      for (let xx = 0; xx < 5; xx++) {
        allKeys.push(xx + "," + yy);
      }
    }
    const shuffled = shuffleArrayLotg(allKeys);
    const nonCenter = shuffled.filter((k) => k !== "2,2");
    lotgState.mapExitCoord = nonCenter[Math.floor(Math.random() * nonCenter.length)];
    const contentKeys = shuffleArrayLotg(allKeys.filter((k) => k !== lotgState.mapExitCoord));
    const typesList = [];
    for (let i = 0; i < 6; i++) typesList.push("enemy");
    for (let i = 0; i < 5; i++) typesList.push("event");
    for (let i = 0; i < 3; i++) typesList.push("shop");
    for (let i = 0; i < 2; i++) typesList.push("skillshop");
    for (let i = 0; i < 1; i++) typesList.push("giftshop");
    for (let i = 0; i < 1; i++) typesList.push("quest");
    for (let i = 0; i < 6; i++) typesList.push("rest");
    const typesShuffled = shuffleArrayLotg(typesList);
    lotgState.mapCellTypes = {};
    lotgState.mapCellMeta = {};
    lotgState.mapBossCellKey = null;
    lotgState.mapCellTypes[lotgState.mapExitCoord] = "exit";
    contentKeys.forEach((k, i) => {
      const t = typesShuffled[i];
      lotgState.mapCellTypes[k] = t;
      if (t === "enemy") {
        lotgState.mapCellMeta[k] = {};
        if (Math.random() < 0.24) lotgState.mapCellMeta[k].miniboss = true;
      }
    });
    const fl = Number.isFinite(lotgState.floor) ? lotgState.floor : 1;
    if (fl % 3 === 0) {
      const enemyKeys = contentKeys.filter((k) => lotgState.mapCellTypes[k] === "enemy");
      const candidates = enemyKeys.filter((k) => k !== lotgState.mapExitCoord);
      if (candidates.length) {
        const bk = candidates[Math.floor(Math.random() * candidates.length)];
        if (!lotgState.mapCellMeta[bk]) lotgState.mapCellMeta[bk] = {};
        lotgState.mapCellMeta[bk].boss = true;
        lotgState.mapCellMeta[bk].miniboss = false;
        lotgState.mapBossCellKey = bk;
      }
    }
    lotgState.mapFloorForExitCoord = fl;
  }

  function buildMiniMap() {
    const el = document.getElementById("lotgMap");
    if (!el || !lotgState) return;
    migrateLotgState(lotgState);
    ensureFloorExitConditions();
    const posParts = String(lotgState.mapPos || "2,2")
      .split(",")
      .map((x) => parseInt(String(x).trim(), 10));
    const px = Number.isFinite(posParts[0]) ? posParts[0] : 2;
    const py = Number.isFinite(posParts[1]) ? posParts[1] : 2;
    el.innerHTML = "";
    const needNewLayout =
      lotgState.mapLayoutFloor !== lotgState.floor ||
      Object.keys(lotgState.mapCellTypes || {}).length === 0;
    if (needNewLayout) {
      randomizeLotgFloorLayout();
      lotgState.mapLayoutFloor = lotgState.floor;
    }
    if (!lotgState.mapExitCoord) {
      const coords = [];
      for (let yy = 0; yy < 5; yy++) {
        for (let xx = 0; xx < 5; xx++) {
          if (xx === 2 && yy === 2) continue;
          coords.push(xx + "," + yy);
        }
      }
      lotgState.mapExitCoord = coords[Math.floor(Math.random() * coords.length)];
      if (lotgState.mapCellTypes && !lotgState.mapCellTypes[lotgState.mapExitCoord]) {
        lotgState.mapCellTypes[lotgState.mapExitCoord] = "exit";
      }
    }
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const key = x + "," + y;
        const cell = document.createElement("div");
        cell.className = "map-cell";
        const dist = Math.abs(x - px) + Math.abs(y - py);
        const revealed = lotgState.mapRevealed[key] || dist <= 1;
        if (revealed) {
          lotgState.mapRevealed[key] = true;
          cell.classList.add("revealed");
          if (!lotgState.mapCellTypes[key]) {
            lotgState.mapCellTypes[key] = key === lotgState.mapExitCoord ? "exit" : "event";
          }
          cell.dataset.type = lotgState.mapCellTypes[key];
          cell.classList.add(cell.dataset.type);
          const metaMap = (lotgState.mapCellMeta && lotgState.mapCellMeta[key]) || {};
          if (cell.dataset.type === "enemy") {
            if (metaMap.boss) {
              cell.classList.add("map-enemy-boss");
              cell.dataset.enemyTier = "boss";
            } else if (metaMap.miniboss) {
              cell.classList.add("map-enemy-miniboss");
              cell.dataset.enemyTier = "miniboss";
            }
          }
          if (lotgState.mapCellDone && lotgState.mapCellDone[key]) cell.classList.add("done");
          let glyph =
            cell.dataset.type === "enemy"
              ? metaMap.boss
                ? "💀"
                : "⚔"
              : cell.dataset.type === "event"
                ? "?"
                : cell.dataset.type === "shop"
                  ? "¤"
                  : cell.dataset.type === "skillshop"
                    ? "◆"
                    : cell.dataset.type === "giftshop"
                      ? "❤"
                      : cell.dataset.type === "quest"
                        ? "📜"
                        : cell.dataset.type === "exit"
                          ? "⇊"
                          : "♥";
          cell.textContent = glyph;
        } else cell.textContent = "·";
        if (x === px && y === py) {
          cell.classList.add("player");
          cell.textContent = "Tú";
        }
        cell.addEventListener("click", () => {
          if (Math.abs(x - px) + Math.abs(y - py) !== 1) return;
          const t = lotgState.mapCellTypes[key];
          const done = lotgState.mapCellDone && lotgState.mapCellDone[key];
          if (done && t !== "exit") {
            lotgState.mapPos = key;
            lotgSave();
            renderLotgGame();
            return;
          }
          if (t === "enemy") {
            const meta = (lotgState.mapCellMeta && lotgState.mapCellMeta[key]) || {};
            if (meta.boss || meta.miniboss) {
              const ok = confirm(
                (meta.boss
                  ? "💀 Jefe de piso — amenaza máxima.\n\n"
                  : "⚔ Mini-jefe de zona — enemigo reforzado (casilla violeta).\n\n") +
                  "Aceptar: luchar ahora.\nCancelar: posponer (no te mueves de casilla)."
              );
              if (!ok) {
                lotgSave();
                renderLotgGame();
                return;
              }
            }
            lotgState.mapPos = key;
            lotgState._pendingMapCellKey = key;
            lotgState._combatIsBoss = !!meta.boss;
            lotgState._combatIsMiniboss = !!meta.miniboss && !meta.boss;
            startCombat();
            return;
          }
          lotgState.mapPos = key;
          if (t === "event") {
            const msg = runRoguelikeMapEvent(key);
            if (msg) alert("Evento\n\n" + msg);
            lotgSave();
            renderLotgGame();
          } else if (t === "shop") {
            openItemShop(key);
            lotgSave();
            renderLotgGame();
          } else if (t === "skillshop") {
            openSkillSoulShop(key);
            lotgSave();
            renderLotgGame();
          } else if (t === "giftshop") {
            openGiftShop(key);
            lotgSave();
            renderLotgGame();
          } else if (t === "quest") {
            const qm = runQuestNpcCell(key);
            if (qm) alert("Misión secundaria\n\n" + qm);
            lotgSave();
            renderLotgGame();
          } else if (t === "rest") {
            const cs2 = applyEquipToProtag();
            const pct = 0.32;
            lotgState.protag.hpCur = Math.min(cs2.hpMax, Math.floor(lotgState.protag.hpCur + cs2.hpMax * pct));
            lotgState.protag.spCur = Math.min(cs2.spMax, Math.floor(lotgState.protag.spCur + cs2.spMax * pct));
            if (!lotgState.partyVitalsPersist) lotgState.partyVitalsPersist = {};
            getPartyUnits().forEach((u) => {
              const st = allyCombatStats(u);
              let pv = lotgState.partyVitalsPersist[u.uid];
              if (!pv || typeof pv.hp !== "number" || typeof pv.sp !== "number") {
                pv = { hp: st.hpMax, sp: st.spMax };
              }
              pv.hp = Math.min(st.hpMax, Math.floor(pv.hp + st.hpMax * pct));
              pv.sp = Math.min(st.spMax, Math.floor(pv.sp + st.spMax * pct));
              lotgState.partyVitalsPersist[u.uid] = pv;
            });
            if (!lotgState.mapCellDone) lotgState.mapCellDone = {};
            lotgState.mapCellDone[key] = true;
            alert("Zona de descanso: recuperas ~32% HP y SP (doctor y aliados en el grupo). Sector completado.");
            lotgSave();
            renderLotgGame();
          } else if (t === "exit") {
            const advance = confirm(
              "Salida del sector (⇊).\n\nAceptar: intentar bajar al siguiente piso (se cumplen condiciones del piso).\nCancelar: quedarte en este piso; puedes volver a esta casilla cuando quieras."
            );
            if (advance) {
              const rule = lotgState.floorAdvanceRule || "free";
              if (rule === "boss" && !lotgState.floorBossCleared) {
                lotgState.mapPos = px + "," + py;
                alert("El nudo no afloja: derrota al jefe de piso (casilla 💀) antes de avanzar.");
              } else if (rule === "key" && !lotgState.floorExitKey) {
                lotgState.mapPos = px + "," + py;
                alert("La salida está sellada. Explora eventos (?) para hallar la llave del sector.");
              } else if (rule === "relic" && !lotgState.floorRelicFound) {
                lotgState.mapPos = px + "," + py;
                alert("Falta la reliquia de registro. Sigue explorando eventos en el mapa.");
              } else {
                if (lotgState.floor === 20) {
                  openFloor20RewardFlow();
                } else {
                  lotgState.floor++;
                  lotgState.mapCellTypes = {};
                  lotgState.mapRevealed = {};
                  lotgState.mapCellDone = {};
                  lotgState.mapCellMeta = {};
                  lotgState.mapBossCellKey = null;
                  lotgState.mapPos = "2,2";
                  alert("Avanzas al piso " + lotgState.floor + ". El sector se reconfigura.");
                }
              }
            }
            lotgSave();
            renderLotgGame();
          } else renderLotgGame();
        });
        el.appendChild(cell);
      }
    }
    const ex = lotgState.mapExitCoord;
    if (ex && lotgState.mapCellTypes[ex] !== "exit") {
      const prev = lotgState.mapCellTypes[ex];
      if (prev === "enemy" && lotgState.mapBossCellKey === ex) {
        lotgState.mapBossCellKey = null;
        if (lotgState.mapCellMeta && lotgState.mapCellMeta[ex]) delete lotgState.mapCellMeta[ex].boss;
      }
      lotgState.mapCellTypes[ex] = "exit";
      if (lotgState.mapCellMeta && lotgState.mapCellMeta[ex]) {
        delete lotgState.mapCellMeta[ex].miniboss;
        delete lotgState.mapCellMeta[ex].boss;
      }
    }
    const flBoss = lotgState.floor || 1;
    if (flBoss % 3 === 0) {
      let bossHere = false;
      Object.keys(lotgState.mapCellTypes || {}).forEach((k) => {
        if (lotgState.mapCellTypes[k] !== "enemy") return;
        const m = lotgState.mapCellMeta && lotgState.mapCellMeta[k];
        if (m && m.boss) bossHere = true;
      });
      if (!bossHere) {
        outerBoss: for (let y2 = 0; y2 < 5; y2++) {
          for (let x2 = 0; x2 < 5; x2++) {
            const k2 = x2 + "," + y2;
            if (lotgState.mapCellTypes[k2] !== "enemy") continue;
            if (k2 === lotgState.mapExitCoord) continue;
            if (!lotgState.mapCellMeta[k2]) lotgState.mapCellMeta[k2] = {};
            lotgState.mapCellMeta[k2].boss = true;
            lotgState.mapBossCellKey = k2;
            break outerBoss;
          }
        }
      }
    }
  }

  /* init: catálogo Patimon y shell primero; LOTG aparte para que un fallo allí no rompa el resto */
  function initApp() {
    try {
      buildStatForm();
      renderSlotFilters();
      renderEquipGrid();
      updatePatimonCatalogStatusUi();
    } catch (e) {
      console.error("[Patimon — catálogo de equipos]", e);
    }
    fetchPatimonPublicCatalog()
      .then(() => {
        try {
          renderEquipGrid();
          updatePatimonCatalogStatusUi();
        } catch (e2) {
          console.error(e2);
        }
      })
      .catch(() => {});
    if (!window.__kbkPatimonCatalogClickBound) {
      window.__kbkPatimonCatalogClickBound = true;
      const btnExport = document.getElementById("btnExportPatimonJson");
      if (btnExport) {
        btnExport.addEventListener("click", function (e) {
          e.preventDefault();
          downloadPatimonCatalogForGithub();
        });
      }
      const btnReload = document.getElementById("btnReloadPatimonCatalog");
      if (btnReload) {
        btnReload.addEventListener("click", function (e) {
          e.preventDefault();
          fetchPatimonPublicCatalog().then(function () {
            try {
              renderEquipGrid();
              updatePatimonCatalogStatusUi();
            } catch (err) {
              console.error(err);
            }
          });
        });
      }
    }
    try {
      setBodyBg();
      setVol();
      playGlobalClinic();
    } catch (e) {
      console.error("[Música / fondo]", e);
    }
    try {
      renderLotgCreate();
    } catch (e) {
      console.error("[Legend of the Gathering — pantalla inicial]", e);
    }
  }

  window.KBK_downloadPatimonCatalog = downloadPatimonCatalogForGithub;
  window.KBK_reloadPatimonCatalogRemote = function () {
    return fetchPatimonPublicCatalog().then(function () {
      try {
        renderEquipGrid();
        updatePatimonCatalogStatusUi();
      } catch (e) {
        console.error(e);
      }
    });
  };

  initApp();
})();
