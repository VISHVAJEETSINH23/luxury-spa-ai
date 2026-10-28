/**
 * What actually happens in each therapy, written for a guest who has never
 * had one — in English, Hindi and Marathi.
 *
 * Keyed by the ids in lib/treatments.ts. Prices and durations stay there;
 * this file is only the explanation. Keep it to what the spa really does:
 * the front desk will be asked about anything written here.
 */
import type { GuestLanguage } from "@/lib/guestLanguage";

export interface TherapyDetail {
  /** Two or three plain sentences: what this therapy is. */
  about: string;
  /** What happens in the session, in order. */
  steps: string[];
  benefits: string[];
  /** Specific to this therapy; the general notes are added separately. */
  goodToKnow: string[];
  pressure: string;
  bestFor: string;
}

type DetailSet = Record<string, TherapyDetail>;

const EN: DetailSet = {
  "dry-massage": {
    about:
      "A full-body massage done without any oil. The therapist uses rhythmic palm and thumb pressure with gentle assisted stretches to loosen stiff muscles and joints — nothing sticky on your skin afterwards.",
    steps: [
      "A quick chat about where you feel stiff and how firm you like the pressure.",
      "You change in your private room and lie down comfortably.",
      "Rhythmic palm and thumb pressure from your back and shoulders down to your legs and feet.",
      "Gentle assisted stretches to open up stiff joints, then a few minutes to rest.",
    ],
    benefits: ["Loosens stiff muscles and joints", "Improves flexibility", "No oil — go straight back to work or a meeting"],
    goodToKnow: ["Pressure is firm. Say “lighter” at any time and the therapist will adjust."],
    pressure: "Firm",
    bestFor: "Stiffness, flexibility",
  },
  "aroma-massage": {
    about:
      "A gentle full-body massage with fragrant aromatic oils and slow, flowing strokes. The scent and the rhythm together calm your mind as much as your body.",
    steps: [
      "You choose your aroma oil — lavender, eucalyptus, lemongrass, or a fragrance-free jojoba & almond blend.",
      "You settle into your private room.",
      "Slow, flowing strokes with warm oil over your back, arms, legs and feet.",
      "A few minutes to rest, then freshen up in the attached hot shower.",
    ],
    benefits: ["Reduces stress and mental tiredness", "Helps you sleep better", "Leaves skin soft and nourished"],
    goodToKnow: ["Allergic to any oil or fragrance? Tell us — we have a hypoallergenic option."],
    pressure: "Light to medium",
    bestFor: "Stress, mental fatigue",
  },
  "swedish-massage": {
    about:
      "The classic relaxation massage — long gliding strokes, gentle kneading and circular movements across the whole body. The perfect choice if it's your first massage.",
    steps: [
      "Tell the therapist your pressure preference and any sore areas.",
      "Long, gliding strokes with oil warm up your muscles.",
      "Gentle kneading and circular movements on your back, shoulders, arms and legs.",
      "Light finishing strokes, a short rest, and a hot shower.",
    ],
    benefits: ["Relaxes the whole body", "Improves blood circulation", "Helps you sleep better"],
    goodToKnow: ["The best pick for a first-time massage."],
    pressure: "Light to medium",
    bestFor: "Relaxation, better sleep",
  },
  "deep-tissue": {
    about:
      "A slow, firm massage that works into the deeper layers of muscle to release knots and long-standing tightness. Best for neck, shoulder and back pain from desk work, driving or the gym.",
    steps: [
      "The therapist asks where it hurts and checks the tight spots.",
      "Warm-up strokes relax the surface muscles first.",
      "Slow, firm pressure with thumbs, knuckles and forearms on the knots.",
      "Soothing strokes to calm the area, then rest and a hot shower.",
    ],
    benefits: ["Releases muscle knots", "Relief from neck, back and shoulder pain", "Eases soreness after workouts"],
    goodToKnow: [
      "Feeling a little sore for a day or two afterwards is normal — drink plenty of water.",
      "Pressure is firm. Say “lighter” at any time.",
    ],
    pressure: "Firm to deep",
    bestFor: "Neck, back & shoulder pain",
  },
  "signature-massage": {
    about:
      "Alexa Salon & Spa's own full-body massage, with the pressure and focus set to what your body needs that day. Ask the front desk what today's session includes.",
    steps: [
      "A quick chat about how you feel and what you want from the session.",
      "The therapist sets the pressure and focus areas just for you.",
      "A complete full-body massage, head to toe.",
      "Rest, then freshen up in the attached hot shower.",
    ],
    benefits: ["A complete full-body reset", "Made around your body, not a fixed routine", "Great when you can't decide"],
    goodToKnow: ["Not sure what to pick? This is the safe choice."],
    pressure: "Tailored to you",
    bestFor: "A complete full-body reset",
  },
  "couple-massage": {
    about:
      "You and your partner (or a friend) are massaged side by side in the same room, each with your own therapist and your own pressure. The price is for both of you.",
    steps: [
      "Both of you tell your therapist your pressure and focus areas.",
      "You settle side by side in the couple suite.",
      "Two therapists massage you both at the same time — each at your own pressure.",
      "Relax together afterwards, then freshen up.",
    ],
    benefits: ["A relaxing experience to share", "Perfect for anniversaries and birthdays", "Each person chooses their own pressure"],
    goodToKnow: ["The price shown is for two guests.", "Evenings are popular — book ahead."],
    pressure: "Set for each guest",
    bestFor: "Couples, anniversaries",
  },
  "couple-jacuzzi": {
    about:
      "Our couple massage with jacuzzi time added — the complete experience for two. Side-by-side massage, then warm water to melt away what's left. The price is for both of you.",
    steps: [
      "Both of you choose your pressure and focus areas.",
      "Side-by-side massage, each with your own therapist.",
      "Time together in the warm jacuzzi.",
      "Freshen up in the shower before you leave.",
    ],
    benefits: ["The complete experience for two", "Warm water relaxes muscles even more", "Made for special occasions"],
    goodToKnow: ["The price shown is for two guests.", "Ask the front desk what to wear in the jacuzzi."],
    pressure: "Set for each guest",
    bestFor: "Special occasions",
  },
  "four-hand": {
    about:
      "Two therapists massage you at the same time with matching, mirrored strokes. Your mind can't follow both pairs of hands, so it simply lets go — a deeper relaxation than one therapist can give.",
    steps: [
      "Tell both therapists your pressure preference.",
      "The two therapists work together, one on each side of you.",
      "Synchronised strokes across your whole body.",
      "Rest for a few minutes, then a hot shower.",
    ],
    benefits: ["Very deep relaxation", "Your whole body is covered at once", "An experience unlike any single massage"],
    goodToKnow: ["It can feel intense the first time — that's normal."],
    pressure: "Medium",
    bestFor: "Deep relaxation",
  },
  "body-scrub": {
    about:
      "A 30-minute full-body exfoliation that gently scrubs away dead skin, leaving it smooth, soft and glowing. Lovely on its own, even better before a massage.",
    steps: [
      "The scrub is applied over your body, one section at a time.",
      "Gentle circular rubbing lifts away dead, dry skin.",
      "You rinse off in the attached hot shower.",
      "Your skin is left soft, smooth and fresh.",
    ],
    benefits: ["Smooth, glowing skin", "Removes dull, dry skin", "Massage oils absorb better afterwards"],
    goodToKnow: ["Avoid shaving or waxing the day before.", "Book it before a massage for the best results."],
    pressure: "Gentle exfoliation",
    bestFor: "Dull or dry skin",
  },
};

const HI: DetailSet = {
  "dry-massage": {
    about:
      "बिना तेल के पूरे शरीर की मसाज। थेरेपिस्ट हथेली और अंगूठे के लयबद्ध दबाव और हल्की स्ट्रेचिंग से अकड़ी हुई मांसपेशियों और जोड़ों को ढीला करते हैं — बाद में त्वचा पर कोई चिपचिपाहट नहीं।",
    steps: [
      "थोड़ी बातचीत — कहाँ अकड़न है और आपको कितना दबाव पसंद है।",
      "आप अपने प्राइवेट रूम में कपड़े बदलकर आराम से लेट जाते हैं।",
      "पीठ और कंधों से लेकर पैरों तक हथेली और अंगूठे से लयबद्ध दबाव।",
      "जोड़ों को खोलने के लिए हल्की स्ट्रेचिंग, फिर कुछ मिनट आराम।",
    ],
    benefits: ["अकड़ी मांसपेशियाँ और जोड़ ढीले होते हैं", "शरीर में लचीलापन बढ़ता है", "तेल नहीं — सीधे काम या मीटिंग पर जा सकते हैं"],
    goodToKnow: ["दबाव तेज़ होता है। कभी भी “हल्का” बोलें, थेरेपिस्ट बदल देंगे।"],
    pressure: "तेज़",
    bestFor: "अकड़न, लचीलापन",
  },
  "aroma-massage": {
    about:
      "खुशबूदार अरोमा तेलों के साथ पूरे शरीर की हल्की और धीमी मसाज। खुशबू और धीमी लय मिलकर शरीर के साथ-साथ मन को भी शांत करती है।",
    steps: [
      "आप अपना तेल चुनते हैं — लैवेंडर, यूकेलिप्टस, लेमनग्रास, या बिना खुशबू वाला जोजोबा और बादाम तेल।",
      "आप अपने प्राइवेट रूम में आराम से लेट जाते हैं।",
      "पीठ, हाथ, पैर और तलवों पर गुनगुने तेल से धीमे, बहते हुए स्ट्रोक।",
      "कुछ मिनट आराम, फिर अटैच्ड गर्म शावर में फ्रेश हो जाइए।",
    ],
    benefits: ["तनाव और मानसिक थकान कम होती है", "नींद अच्छी आती है", "त्वचा मुलायम और पोषित होती है"],
    goodToKnow: ["किसी तेल या खुशबू से एलर्जी है? हमें बताइए — हमारे पास एलर्जी-फ्री विकल्प है।"],
    pressure: "हल्का से मध्यम",
    bestFor: "तनाव, मानसिक थकान",
  },
  "swedish-massage": {
    about:
      "सबसे लोकप्रिय रिलैक्सिंग मसाज — पूरे शरीर पर लंबे, फिसलते स्ट्रोक, हल्का गूँधना और गोल-गोल मूवमेंट। अगर आप पहली बार मसाज ले रहे हैं, तो यह सबसे सही है।",
    steps: [
      "थेरेपिस्ट को अपना पसंदीदा दबाव और दर्द वाली जगह बताइए।",
      "तेल के साथ लंबे, फिसलते स्ट्रोक से मांसपेशियाँ गर्म होती हैं।",
      "पीठ, कंधे, हाथ और पैरों पर हल्का गूँधना और गोल-गोल मूवमेंट।",
      "हल्के आखिरी स्ट्रोक, थोड़ा आराम और गर्म शावर।",
    ],
    benefits: ["पूरा शरीर रिलैक्स होता है", "खून का बहाव बेहतर होता है", "नींद अच्छी आती है"],
    goodToKnow: ["पहली बार मसाज के लिए सबसे अच्छा विकल्प।"],
    pressure: "हल्का से मध्यम",
    bestFor: "आराम, अच्छी नींद",
  },
  "deep-tissue": {
    about:
      "धीमी और गहरी मसाज जो मांसपेशियों की अंदरूनी परतों तक जाकर गांठें और पुरानी जकड़न खोलती है। डेस्क जॉब, ड्राइविंग या जिम से होने वाले गर्दन, कंधे और पीठ दर्द के लिए सबसे अच्छी।",
    steps: [
      "थेरेपिस्ट पूछते हैं कि दर्द कहाँ है और जकड़न वाली जगह जाँचते हैं।",
      "पहले हल्के स्ट्रोक से ऊपरी मांसपेशियों को ढीला किया जाता है।",
      "अंगूठे, उंगलियों के जोड़ और बांह (कलाई से कोहनी तक का हिस्सा) से गांठों पर धीमा, गहरा दबाव।",
      "आखिर में आराम देने वाले स्ट्रोक, फिर आराम और गर्म शावर।",
    ],
    benefits: ["मांसपेशियों की गांठें खुलती हैं", "गर्दन, पीठ और कंधे के दर्द में राहत", "वर्कआउट के बाद का दर्द कम होता है"],
    goodToKnow: [
      "बाद में एक-दो दिन हल्का दर्द होना सामान्य है — खूब पानी पिएँ।",
      "दबाव तेज़ होता है। कभी भी “हल्का” बोलें।",
    ],
    pressure: "तेज़ से गहरा",
    bestFor: "गर्दन, पीठ और कंधे का दर्द",
  },
  "signature-massage": {
    about:
      "Alexa Salon & Spa की अपनी खास फुल-बॉडी मसाज, जिसमें दबाव और फोकस उस दिन आपके शरीर की ज़रूरत के हिसाब से तय होता है। आज के सेशन में क्या शामिल है, यह फ्रंट डेस्क से पूछें।",
    steps: [
      "थोड़ी बातचीत — आप कैसा महसूस कर रहे हैं और सेशन से क्या चाहते हैं।",
      "थेरेपिस्ट आपके लिए दबाव और फोकस वाली जगह तय करते हैं।",
      "सिर से पैर तक पूरे शरीर की मसाज।",
      "आराम, फिर अटैच्ड गर्म शावर में फ्रेश हो जाइए।",
    ],
    benefits: ["पूरे शरीर का कम्प्लीट रीसेट", "तय रूटीन नहीं, आपके शरीर के हिसाब से", "जब समझ न आए क्या लें, तब बढ़िया"],
    goodToKnow: ["समझ नहीं आ रहा क्या चुनें? यह सबसे सुरक्षित विकल्प है।"],
    pressure: "आपके हिसाब से",
    bestFor: "पूरे शरीर का रीसेट",
  },
  "couple-massage": {
    about:
      "आप और आपके पार्टनर (या दोस्त) एक ही कमरे में साथ-साथ मसाज लेते हैं, हर किसी का अपना थेरेपिस्ट और अपना दबाव। कीमत दोनों के लिए है।",
    steps: [
      "आप दोनों अपने थेरेपिस्ट को दबाव और फोकस वाली जगह बताते हैं।",
      "कपल सुइट में आप साथ-साथ लेट जाते हैं।",
      "दो थेरेपिस्ट एक साथ मसाज करते हैं — हर किसी को उसके पसंद के दबाव से।",
      "बाद में साथ में आराम, फिर फ्रेश हो जाइए।",
    ],
    benefits: ["साथ में बिताया एक सुकून भरा अनुभव", "एनिवर्सरी और बर्थडे के लिए बढ़िया", "हर कोई अपना दबाव खुद चुनता है"],
    goodToKnow: ["दिखाई गई कीमत दो लोगों के लिए है।", "शाम के स्लॉट जल्दी भरते हैं — पहले से बुक करें।"],
    pressure: "हर व्यक्ति के हिसाब से",
    bestFor: "कपल, एनिवर्सरी",
  },
  "couple-jacuzzi": {
    about:
      "हमारी कपल मसाज के साथ जकूज़ी का समय भी — दो लोगों के लिए पूरा अनुभव। साथ-साथ मसाज, फिर गर्म पानी में बची हुई थकान भी दूर। कीमत दोनों के लिए है।",
    steps: [
      "आप दोनों अपना दबाव और फोकस वाली जगह चुनते हैं।",
      "साथ-साथ मसाज, हर किसी का अपना थेरेपिस्ट।",
      "गर्म जकूज़ी में साथ में समय।",
      "जाने से पहले शावर में फ्रेश हो जाइए।",
    ],
    benefits: ["दो लोगों के लिए पूरा अनुभव", "गर्म पानी से मांसपेशियाँ और रिलैक्स होती हैं", "खास मौकों के लिए बना"],
    goodToKnow: ["दिखाई गई कीमत दो लोगों के लिए है।", "जकूज़ी में क्या पहनना है, यह फ्रंट डेस्क से पूछें।"],
    pressure: "हर व्यक्ति के हिसाब से",
    bestFor: "खास मौके",
  },
  "four-hand": {
    about:
      "दो थेरेपिस्ट एक साथ, एक जैसे स्ट्रोक से आपकी मसाज करते हैं। दिमाग चारों हाथों को फॉलो नहीं कर पाता, इसलिए पूरी तरह ढीला छोड़ देता है — एक थेरेपिस्ट से कहीं ज़्यादा गहरा आराम।",
    steps: [
      "दोनों थेरेपिस्ट को अपना पसंदीदा दबाव बताइए।",
      "दोनों थेरेपिस्ट आपके दोनों तरफ से साथ में काम करते हैं।",
      "पूरे शरीर पर एक जैसे, तालमेल वाले स्ट्रोक।",
      "कुछ मिनट आराम, फिर गर्म शावर।",
    ],
    benefits: ["बहुत गहरा आराम", "पूरे शरीर पर एक साथ मसाज", "किसी भी आम मसाज से अलग अनुभव"],
    goodToKnow: ["पहली बार थोड़ा अलग लग सकता है — यह सामान्य है।"],
    pressure: "मध्यम",
    bestFor: "गहरा आराम",
  },
  "body-scrub": {
    about:
      "30 मिनट का पूरे शरीर का स्क्रब जो डेड स्किन को हल्के से हटाकर त्वचा को मुलायम, चिकनी और चमकदार बनाता है। अकेले भी अच्छा, और मसाज से पहले तो और भी बढ़िया।",
    steps: [
      "शरीर के एक-एक हिस्से पर स्क्रब लगाया जाता है।",
      "हल्के गोल-गोल रगड़ से डेड और रूखी त्वचा हटती है।",
      "अटैच्ड गर्म शावर में धो लीजिए।",
      "त्वचा मुलायम, चिकनी और ताज़ा हो जाती है।",
    ],
    benefits: ["चिकनी, चमकदार त्वचा", "रूखी और बेजान त्वचा हटती है", "बाद में मसाज का तेल बेहतर असर करता है"],
    goodToKnow: ["एक दिन पहले शेविंग या वैक्सिंग न करें।", "बेहतरीन नतीजे के लिए मसाज से पहले बुक करें।"],
    pressure: "हल्का स्क्रब",
    bestFor: "रूखी या बेजान त्वचा",
  },
};

const MR: DetailSet = {
  "dry-massage": {
    about:
      "तेलाशिवाय संपूर्ण शरीराचा मसाज. थेरपिस्ट तळहात आणि अंगठ्याच्या लयबद्ध दाबाने आणि हलक्या स्ट्रेचिंगने आखडलेले स्नायू आणि सांधे मोकळे करतात — नंतर त्वचेवर कोणताही चिकटपणा नाही.",
    steps: [
      "थोडी चर्चा — कुठे आखडलंय आणि तुम्हाला किती दाब आवडतो.",
      "तुम्ही तुमच्या प्रायव्हेट रूममध्ये कपडे बदलून आरामात झोपता.",
      "पाठ आणि खांद्यांपासून पायांपर्यंत तळहात आणि अंगठ्याने लयबद्ध दाब.",
      "सांधे मोकळे करण्यासाठी हलके स्ट्रेचिंग, नंतर काही मिनिटे विश्रांती.",
    ],
    benefits: ["आखडलेले स्नायू आणि सांधे मोकळे होतात", "शरीराची लवचिकता वाढते", "तेल नाही — थेट कामावर किंवा मीटिंगला जाऊ शकता"],
    goodToKnow: ["दाब जोरात असतो. कधीही “हलका” सांगा, थेरपिस्ट बदलतील."],
    pressure: "जोरात",
    bestFor: "आखडलेपणा, लवचिकता",
  },
  "aroma-massage": {
    about:
      "सुगंधी अरोमा तेलांसह संपूर्ण शरीराचा हलका आणि संथ मसाज. सुगंध आणि संथ लय मिळून शरीरासोबत मनालाही शांत करतात.",
    steps: [
      "तुम्ही तुमचे तेल निवडता — लॅव्हेंडर, निलगिरी, लेमनग्रास, किंवा सुगंधविरहित जोजोबा आणि बदाम तेल.",
      "तुम्ही तुमच्या प्रायव्हेट रूममध्ये आरामात झोपता.",
      "पाठ, हात, पाय आणि तळपायांवर कोमट तेलाने संथ, प्रवाही स्ट्रोक.",
      "काही मिनिटे विश्रांती, नंतर अटॅच्ड गरम शॉवरमध्ये फ्रेश व्हा.",
    ],
    benefits: ["ताण आणि मानसिक थकवा कमी होतो", "झोप चांगली लागते", "त्वचा मऊ आणि पोषित होते"],
    goodToKnow: ["कोणत्या तेलाची किंवा सुगंधाची ॲलर्जी आहे? आम्हाला सांगा — आमच्याकडे ॲलर्जी-फ्री पर्याय आहे."],
    pressure: "हलका ते मध्यम",
    bestFor: "ताण, मानसिक थकवा",
  },
  "swedish-massage": {
    about:
      "सर्वात लोकप्रिय रिलॅक्सिंग मसाज — संपूर्ण शरीरावर लांब, सरकते स्ट्रोक, हलके मळणे आणि गोलाकार हालचाली. तुम्ही पहिल्यांदा मसाज घेत असाल तर हा सर्वात योग्य आहे.",
    steps: [
      "थेरपिस्टला तुमचा आवडता दाब आणि दुखणारी जागा सांगा.",
      "तेलासह लांब, सरकत्या स्ट्रोकने स्नायू उबदार होतात.",
      "पाठ, खांदे, हात आणि पायांवर हलके मळणे आणि गोलाकार हालचाली.",
      "हलके शेवटचे स्ट्रोक, थोडी विश्रांती आणि गरम शॉवर.",
    ],
    benefits: ["संपूर्ण शरीर रिलॅक्स होते", "रक्ताभिसरण सुधारते", "झोप चांगली लागते"],
    goodToKnow: ["पहिल्यांदा मसाज घेण्यासाठी सर्वोत्तम पर्याय."],
    pressure: "हलका ते मध्यम",
    bestFor: "आराम, चांगली झोप",
  },
  "deep-tissue": {
    about:
      "संथ आणि खोल मसाज जो स्नायूंच्या आतल्या थरांपर्यंत जाऊन गाठी आणि जुना आखडलेपणा मोकळा करतो. डेस्क जॉब, ड्रायव्हिंग किंवा जिममुळे होणाऱ्या मान, खांदा आणि पाठदुखीसाठी सर्वोत्तम.",
    steps: [
      "थेरपिस्ट विचारतात की कुठे दुखतंय आणि आखडलेली जागा तपासतात.",
      "आधी हलक्या स्ट्रोकने वरचे स्नायू सैल केले जातात.",
      "अंगठा, बोटांचे सांधे आणि हात (मनगटापासून कोपरापर्यंतचा भाग) यांनी गाठींवर संथ, खोल दाब.",
      "शेवटी आराम देणारे स्ट्रोक, नंतर विश्रांती आणि गरम शॉवर.",
    ],
    benefits: ["स्नायूंच्या गाठी मोकळ्या होतात", "मान, पाठ आणि खांदेदुखीत आराम", "वर्कआउटनंतरचे दुखणे कमी होते"],
    goodToKnow: [
      "नंतर एक-दोन दिवस थोडे दुखणे सामान्य आहे — भरपूर पाणी प्या.",
      "दाब जोरात असतो. कधीही “हलका” सांगा.",
    ],
    pressure: "जोरात ते खोल",
    bestFor: "मान, पाठ आणि खांदेदुखी",
  },
  "signature-massage": {
    about:
      "Alexa Salon & Spa चा स्वतःचा खास फुल-बॉडी मसाज, ज्यात दाब आणि फोकस त्या दिवशी तुमच्या शरीराच्या गरजेनुसार ठरतो. आजच्या सेशनमध्ये काय आहे ते फ्रंट डेस्कला विचारा.",
    steps: [
      "थोडी चर्चा — तुम्हाला कसं वाटतंय आणि सेशनकडून काय हवंय.",
      "थेरपिस्ट तुमच्यासाठी दाब आणि फोकसची जागा ठरवतात.",
      "डोक्यापासून पायापर्यंत संपूर्ण शरीराचा मसाज.",
      "विश्रांती, नंतर अटॅच्ड गरम शॉवरमध्ये फ्रेश व्हा.",
    ],
    benefits: ["संपूर्ण शरीराचा कम्प्लीट रीसेट", "ठरलेले रूटीन नाही, तुमच्या शरीरानुसार", "काय घ्यावं कळत नसेल तेव्हा उत्तम"],
    goodToKnow: ["काय निवडावं कळत नाहीये? हा सर्वात सुरक्षित पर्याय आहे."],
    pressure: "तुमच्या गरजेनुसार",
    bestFor: "संपूर्ण शरीराचा रीसेट",
  },
  "couple-massage": {
    about:
      "तुम्ही आणि तुमचा पार्टनर (किंवा मित्र) एकाच खोलीत शेजारी-शेजारी मसाज घेता, प्रत्येकाला स्वतःचा थेरपिस्ट आणि स्वतःचा दाब. किंमत दोघांसाठी आहे.",
    steps: [
      "तुम्ही दोघे तुमच्या थेरपिस्टला दाब आणि फोकसची जागा सांगता.",
      "कपल सूटमध्ये तुम्ही शेजारी-शेजारी झोपता.",
      "दोन थेरपिस्ट एकाच वेळी मसाज करतात — प्रत्येकाला त्याच्या आवडीच्या दाबाने.",
      "नंतर एकत्र विश्रांती, मग फ्रेश व्हा.",
    ],
    benefits: ["एकत्र घालवलेला निवांत अनुभव", "ॲनिव्हर्सरी आणि वाढदिवसासाठी उत्तम", "प्रत्येकजण आपला दाब स्वतः निवडतो"],
    goodToKnow: ["दाखवलेली किंमत दोघांसाठी आहे.", "संध्याकाळचे स्लॉट लवकर भरतात — आधीच बुक करा."],
    pressure: "प्रत्येकाच्या गरजेनुसार",
    bestFor: "कपल, ॲनिव्हर्सरी",
  },
  "couple-jacuzzi": {
    about:
      "आमच्या कपल मसाजसोबत जकूझीचा वेळही — दोघांसाठी संपूर्ण अनुभव. शेजारी-शेजारी मसाज, मग गरम पाण्यात उरलेला थकवाही दूर. किंमत दोघांसाठी आहे.",
    steps: [
      "तुम्ही दोघे तुमचा दाब आणि फोकसची जागा निवडता.",
      "शेजारी-शेजारी मसाज, प्रत्येकाला स्वतःचा थेरपिस्ट.",
      "गरम जकूझीमध्ये एकत्र वेळ.",
      "जाण्यापूर्वी शॉवरमध्ये फ्रेश व्हा.",
    ],
    benefits: ["दोघांसाठी संपूर्ण अनुभव", "गरम पाण्याने स्नायू आणखी रिलॅक्स होतात", "खास प्रसंगांसाठी बनवलेले"],
    goodToKnow: ["दाखवलेली किंमत दोघांसाठी आहे.", "जकूझीमध्ये काय घालायचं ते फ्रंट डेस्कला विचारा."],
    pressure: "प्रत्येकाच्या गरजेनुसार",
    bestFor: "खास प्रसंग",
  },
  "four-hand": {
    about:
      "दोन थेरपिस्ट एकाच वेळी, एकसारख्या स्ट्रोकने तुमचा मसाज करतात. मेंदू चारही हातांचा मागोवा घेऊ शकत नाही, म्हणून पूर्णपणे सैल सोडतो — एका थेरपिस्टपेक्षा खूप खोल आराम.",
    steps: [
      "दोन्ही थेरपिस्टना तुमचा आवडता दाब सांगा.",
      "दोन्ही थेरपिस्ट तुमच्या दोन्ही बाजूंनी एकत्र काम करतात.",
      "संपूर्ण शरीरावर एकसारखे, ताळमेळ असलेले स्ट्रोक.",
      "काही मिनिटे विश्रांती, नंतर गरम शॉवर.",
    ],
    benefits: ["खूप खोल आराम", "संपूर्ण शरीरावर एकाच वेळी मसाज", "कोणत्याही साध्या मसाजपेक्षा वेगळा अनुभव"],
    goodToKnow: ["पहिल्यांदा थोडं वेगळं वाटू शकतं — हे सामान्य आहे."],
    pressure: "मध्यम",
    bestFor: "खोल आराम",
  },
  "body-scrub": {
    about:
      "30 मिनिटांचा संपूर्ण शरीराचा स्क्रब जो डेड स्किन हलकेच काढून त्वचा मऊ, गुळगुळीत आणि तजेलदार बनवतो. एकट्यानेही छान, आणि मसाजच्या आधी तर आणखी उत्तम.",
    steps: [
      "शरीराच्या एकेका भागावर स्क्रब लावला जातो.",
      "हलक्या गोलाकार घासण्याने डेड आणि कोरडी त्वचा निघते.",
      "अटॅच्ड गरम शॉवरमध्ये धुवून घ्या.",
      "त्वचा मऊ, गुळगुळीत आणि ताजी होते.",
    ],
    benefits: ["गुळगुळीत, तजेलदार त्वचा", "कोरडी आणि निस्तेज त्वचा निघते", "नंतर मसाजचे तेल चांगले शोषले जाते"],
    goodToKnow: ["आदल्या दिवशी शेव्हिंग किंवा वॅक्सिंग करू नका.", "उत्तम परिणामासाठी मसाजच्या आधी बुक करा."],
    pressure: "हलका स्क्रब",
    bestFor: "कोरडी किंवा निस्तेज त्वचा",
  },
};

const DETAILS: Record<GuestLanguage, DetailSet> = { en: EN, hi: HI, mr: MR };

export function getTherapyDetail(id: string, language: GuestLanguage): TherapyDetail | undefined {
  return DETAILS[language][id] ?? EN[id];
}

/** Shown under every therapy, whatever it is. */
export const GENERAL_NOTES: Record<GuestLanguage, string[]> = {
  en: [
    "Pregnant, recently had surgery, have a fever or a skin problem? Tell us before your session.",
    "You can ask your therapist to change the pressure at any time.",
    "Every session: a private room, an attached hot shower and fresh single-use linen.",
  ],
  hi: [
    "गर्भवती हैं, हाल में सर्जरी हुई है, बुखार है या त्वचा की कोई समस्या है? सेशन से पहले हमें बताइए।",
    "आप कभी भी थेरेपिस्ट से दबाव बदलने को कह सकते हैं।",
    "हर सेशन में: प्राइवेट रूम, अटैच्ड गर्म शावर और नई सिंगल-यूज़ चादरें।",
  ],
  mr: [
    "गरोदर आहात, नुकतीच शस्त्रक्रिया झाली आहे, ताप आहे किंवा त्वचेची काही समस्या आहे? सेशनपूर्वी आम्हाला सांगा.",
    "तुम्ही कधीही थेरपिस्टला दाब बदलायला सांगू शकता.",
    "प्रत्येक सेशनमध्ये: प्रायव्हेट रूम, अटॅच्ड गरम शॉवर आणि नवीन सिंगल-यूज चादरी.",
  ],
};

/** The English steps, for the AI prompt — the model translates as it replies. */
export function stepsForPrompt(id: string): string {
  const detail = EN[id];
  return detail ? detail.steps.join(" → ") : "";
}
