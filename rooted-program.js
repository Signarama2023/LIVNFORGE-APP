/* LIVN FORGE — Level 1 core, "Rooted and Ready".
   A 12-week opt-in discipleship course for a small group of men.
   Scripture is by reference. Short sense-lines are our words, not a translation.
   This file is data and pure rules only. It does not enroll anyone or touch storage.
   Future levels are named so the path is visible. They have no lessons and cannot be completed. */
(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.RootedProgram = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var PROGRAM_ID = "rooted-l1";
  var STEP_KEYS = ["read", "reflect", "pray", "practice"];

  var LEVELS = [
    {
      id: 1,
      name: "Rooted",
      focus: "Scripture, prayer, and identity",
      available: true,
      summary: "These 12 weeks are the published core of Level 1. They are not the whole of a longer level, and finishing them does not promote anyone."
    },
    {
      id: 2,
      name: "Faithful",
      focus: "Obedience, integrity, and accountability",
      available: false,
      summary: "Proposed for later. No lessons, practices, or completion exist for this level."
    },
    {
      id: 3,
      name: "Responsible",
      focus: "Relationships, family, work, the body, and money as stewardship",
      available: false,
      summary: "Proposed for later. No lessons, practices, or completion exist for this level."
    },
    {
      id: 4,
      name: "Purposeful",
      focus: "Gifts, service, and calling",
      available: false,
      summary: "Proposed for later. No lessons, practices, or completion exist for this level."
    },
    {
      id: 5,
      name: "Equipping",
      focus: "Mentoring and facilitating",
      available: false,
      summary: "Proposed for later. No lessons, practices, or completion exist for this level."
    },
    {
      id: 6,
      name: "Multiplying",
      focus: "Supported group leadership",
      available: false,
      summary: "Proposed for later. No lessons, practices, or completion exist for this level. This app does not certify leaders."
    }
  ];

  var WEEKS = [
    {
      n: 1,
      section: "Foundation",
      title: "Rooted in the Word",
      passage: "2 Timothy 3:14–17",
      passageLoad: "2 Timothy 3:14-17",
      passageNote: "Read the whole paragraph. If you have time, begin at 2 Timothy 3:10 so you hear what Paul is asking Timothy to continue.",
      keyVerse: "Psalm 119:105",
      translation: "NIV",
      plainSense: "Scripture gives light for the step in front of you, not a demand that you already see the whole road.",
      text: "Paul urges Timothy to stay with what he has learned and firmly believed, remembering who taught him. The sacred writings are able to make a person wise for salvation through faith in Christ Jesus. All Scripture is God-breathed and useful for teaching, reproof, correction, and training in righteousness, so that God’s servant is equipped for every good work.",
      interpretation: "A short, repeatable reading rhythm is a wise way to begin. This passage does not assign a required number of days or a reading plan. It also does not bless using verses to win an argument. Read in context, and leave room for questions. Men who are exploring faith belong in the conversation.",
      practiceNote: "One possible practice is to read the passage on three days and keep a single observation, a single question, and a single response. Missing a day is a chance to begin again, not a verdict.",
      prompts: [
        "What experiences have shaped the way you approach the Bible?",
        "What does Paul say Scripture does, and where does faith in Christ fit?",
        "How are teaching and correction different from using the Bible to win an argument?",
        "What question about the Bible would you like freedom to ask here?",
        "What reading rhythm would be manageable rather than overwhelming?"
      ],
      prayer: "Ask God for a teachable heart and for understanding that stays centered on Christ. Praying aloud is optional.",
      action: "Read 2 Timothy 3:14–17 on three days if you can. Each time, notice one thing, ask one question, and pray one honest response.",
      caution: ""
    },
    {
      n: 2,
      section: "Foundation",
      title: "Identity received, not earned",
      passage: "Ephesians 2:1–10",
      passageLoad: "Ephesians 2:1-10",
      passageNote: "Read the whole passage, including the contrast that opens it. Do not stop at the encouraging lines and skip the mercy that makes them true.",
      keyVerse: "Ephesians 2:10",
      translation: "NIV",
      plainSense: "God makes a people alive in Christ. The good we do follows that gift. It does not purchase it.",
      text: "Paul describes a condition of death in trespasses, then a God who is rich in mercy. He makes the readers alive with Christ, raises them, and seats them with him. Salvation is by grace through faith, and Paul says this is not their own doing: it is the gift of God, not a result of works, so that no one may boast. They are created in Christ Jesus for good works God prepared.",
      interpretation: "Purpose can grow out of grace rather than out of status or achievement. This passage does not reveal a hidden career for each man, and it does not rank men by productivity. Someone who is not sure what he believes can answer honestly. Do not ask him to pretend he has already trusted Christ.",
      practiceNote: "One possible practice is to notice a moment when you try to earn your worth, then reread Ephesians 2:8–10. The rereading is a way of remembering grace, not a technique that earns it.",
      prompts: [
        "What contrast does Paul draw between our condition apart from Christ and God’s action?",
        "How does this passage connect grace, faith, and good works?",
        "Where do you feel pressure to earn your worth by achievement?",
        "How might grace change the way you respond to failure?",
        "What small good work is within reach without a grand life plan?"
      ],
      prayer: "Thank God for mercy, and ask for help receiving grace instead of performing for it.",
      action: "Once this week, notice a moment of performance-based self-worth. Reread Ephesians 2:8–10 and tell God the truth about that moment.",
      caution: ""
    },
    {
      n: 3,
      section: "God",
      title: "Abide before you strive",
      passage: "John 15:1–12",
      passageLoad: "John 15:1-12",
      passageNote: "Read Jesus’ picture of the vine slowly enough to notice the repeated call to remain.",
      keyVerse: "John 15:9",
      translation: "NIV",
      plainSense: "Jesus loves his friends with the love he has received from the Father, and he tells them to remain in that love.",
      text: "Jesus calls himself the true vine and his Father the gardener. Branches that remain in him bear fruit. Apart from him, he says, they can do nothing. He ties fruit to dependence, to his words remaining in his disciples, to prayer, and to love for one another of the kind he has already given.",
      interpretation: "Abiding is a relationship of dependence, not a productivity system and not only a devotional routine. Quiet prayer can support attention to Jesus. Fruit in this passage must not be equated with money, influence, or visible ministry success. Religious busyness can imitate fruit while the branch is distracted.",
      practiceNote: "One possible practice is five unrushed minutes with a few lines of John 15 and an honest prayer. The minutes are a support, not the definition of remaining.",
      prompts: [
        "What does the vine-and-branches picture teach about dependence?",
        "How are Jesus’ words, obedience, love, and fruit connected?",
        "Where might religious busyness replace attention to Jesus?",
        "What helps you remain attentive to him on an ordinary day?",
        "What might love-shaped fruit look like in one relationship this week?"
      ],
      prayer: "Ask Jesus to grow dependence and love in the place where self-reliance has taken over.",
      action: "On several days, spend about five minutes reading a few lines from John 15 and praying honestly. Stop while you are still attentive rather than trying to manufacture a feeling.",
      caution: ""
    },
    {
      n: 4,
      section: "God",
      title: "Hear and do",
      passage: "James 1:19–27",
      passageLoad: "James 1:19-27",
      passageNote: "Read from verse 19 through verse 27 so listening, speech, anger, and care for vulnerable people stay together.",
      keyVerse: "James 1:22",
      translation: "NIV",
      plainSense: "Listening to Scripture without responding to it is a way of deceiving ourselves.",
      text: "James tells his readers to be quick to listen, slow to speak, and slow to anger. He tells them to put away what soils them and to receive the implanted word. He warns against hearing the word and not doing it. He names care for orphans and widows in their distress, and a life not stained by the world, as the shape of religion God accepts.",
      interpretation: "One concrete response is a useful next step. It is not a payment toward salvation. James’s instructions are not the same thing as a leader’s preferred habits or a ministry role. Choose a response you can actually practice. You do not have to fix everything.",
      practiceNote: "One possible practice is a single response in speech, listening, or practical care. The practice is an invitation. It does not prove that you belong.",
      prompts: [
        "What actions does James connect with receiving God’s word?",
        "Why do listening, speech, and anger belong in discipleship?",
        "Where is it easier for you to discuss obedience than to practice it?",
        "What does care for vulnerable people show about a faith that acts?",
        "What is one clear response you can make without trying to repair every relationship or habit?"
      ],
      prayer: "Ask for courage to obey and for humility to listen before you speak.",
      action: "Practice one response this week: attentive listening, restrained speech, or a practical act of care for someone who is hurting. Tell the group what you chose only if you want to.",
      caution: ""
    },
    {
      n: 5,
      section: "Family",
      title: "Love the people closest to you",
      passage: "Colossians 3:12–17",
      passageLoad: "Colossians 3:12-17",
      passageNote: "Read the identity Paul names before the list of qualities. Family here means the people actually given to you, not a required household shape.",
      keyVerse: "Colossians 3:14",
      translation: "NIV",
      plainSense: "Love is the virtue that holds the others together.",
      text: "Paul addresses people who are God’s chosen, holy, and dearly loved. From that identity he calls them to compassion, kindness, humility, meekness, patience, and forgiveness, with love over all of it. The peace of Christ is to rule in the community. The word of Christ is to dwell among them, with teaching, admonition, singing, and gratitude.",
      interpretation: "These qualities belong in close relationships. The passage does not authorize control, and it does not require every man to be married or to have children. A single, widowed, divorced, or childless man can practice this with parents, friends, housemates, or church family. Forgiveness does not erase consequences and does not require returning to an unsafe relationship. Patience is not the same thing as avoiding a necessary conversation.",
      practiceNote: "One possible practice is a single act of care offered without requiring recognition or a particular response.",
      prompts: [
        "What identity does Paul name before he describes conduct?",
        "Which quality in this list most challenges your close relationships?",
        "How is patience different from avoiding a conversation that needs to happen?",
        "How can men in different family situations practice this passage?",
        "What concrete act of kindness is possible this week?"
      ],
      prayer: "Ask for compassion, and for wisdom to love with truthful and healthy boundaries.",
      action: "Offer one act of care to someone close to you. Do not demand thanks or a matching response. If a relationship is unsafe, choose a different person or a wise boundary instead of contact.",
      caution: "Forgiveness is not a demand to return to harm. If a relationship is unsafe, do not treat contact as the faithful step."
    },
    {
      n: 6,
      section: "Family",
      title: "Humility, repair, and peace",
      passage: "Romans 12:9–21",
      passageLoad: "Romans 12:9-21",
      passageNote: "Read the whole exhortation. The limits in verse 18 are part of the text, not a loophole added later.",
      keyVerse: "Romans 12:18",
      translation: "NIV",
      plainSense: "Peace includes doing what is actually yours to do, and it admits that the outcome is not entirely in your hands.",
      text: "Paul calls for genuine love, for rejecting evil and holding to good, for blessing those who persecute, and for harmony and humility. He forbids repaying evil for evil. He says, if possible, so far as it depends on you, live peaceably with all. He leaves vengeance with God and tells his readers to answer evil with good.",
      interpretation: "An apology, a listening conversation, or a request for qualified help can serve peace. Reconciliation cannot be demanded or guaranteed. The phrases “if it is possible” and “so far as it depends on you” recognize limits. Abuse is not a mutual communication problem. Do not send someone to confront an abusive person alone, and do not conduct a group investigation.",
      practiceNote: "One possible practice is a single safe repair step: listen, offer a specific apology for your own part, or seek qualified guidance before any contact.",
      prompts: [
        "What makes the love in this passage genuine rather than merely polite?",
        "Which instruction challenges your usual response to conflict?",
        "What limits do “if it is possible” and “as far as it depends on you” recognize?",
        "Where might you need to own harm, listen, or keep a wise boundary?",
        "What safe next step is yours, and what is outside your control?"
      ],
      prayer: "Ask for humility to own your part, and for wisdom about safety and limits.",
      action: "Take one safe step toward peace: listen well, make a specific apology for something you did, or ask a qualified person for guidance before you make contact. Do not force a confrontation.",
      caution: "If someone may be in danger, the faithful step is appropriate help, not a private confrontation. In immediate danger in the U.S., call 911. For a mental-health crisis, call or text 988."
    },
    {
      n: 7,
      section: "Work",
      title: "Faithfulness in ordinary work",
      passage: "Colossians 3:22–4:1",
      passageLoad: "Colossians 3:22-4:1",
      passageNote: "Read through Colossians 4:1. Paul addresses both enslaved members of a household and masters, and he holds the masters to account.",
      keyVerse: "Colossians 3:23",
      translation: "NIV",
      plainSense: "The work in front of you can be done with a whole heart before the Lord, not only to be seen by people.",
      text: "In a first-century household, Paul speaks to enslaved people and to masters. He calls for sincere work, done as for the Lord rather than for human approval, and he says the wrongdoer will be repaid. He then tells masters to treat those under them justly and fairly, because they also have a Master in heaven.",
      interpretation: "Integrity in paid work, caregiving, study, volunteering, or a job search is an application of this passage. It is not an equation of modern employment with slavery, and it is not an endorsement of slavery. Do not use these verses to excuse coercion, unsafe conditions, or injustice. A person’s dignity does not depend on having a job. Wholehearted work is not the same thing as overwork or accepting exploitation.",
      practiceNote: "One possible practice is to complete one overlooked responsibility faithfully, or to take one realistic step toward needed work. The step should fit the life you actually have.",
      prompts: [
        "Who is addressed in this passage, and what responsibility does each person receive?",
        "What changes when work is done before the Lord rather than only for approval?",
        "How does the demand for fairness challenge people who hold power?",
        "Where could integrity grow in your paid work, caregiving, study, volunteering, or job search?",
        "How is wholehearted service different from overwork or accepting exploitation?"
      ],
      prayer: "Ask for integrity in ordinary tasks, and for justice wherever you have influence.",
      action: "Finish one real responsibility you have been postponing, or take one realistic step toward work you need. If your workplace is unsafe, the faithful step may be to seek help rather than to endure harm quietly.",
      caution: "This passage does not bless slavery, coercion, or unsafe work. Employment status is not a measure of worth."
    },
    {
      n: 8,
      section: "Work",
      title: "Serve with what you have",
      passage: "1 Peter 4:7–11",
      passageLoad: "1 Peter 4:7-11",
      passageNote: "Read verses 7 through 11 together so prayer, love, hospitality, and gifts stay connected.",
      keyVerse: "1 Peter 4:10",
      translation: "NIV",
      plainSense: "What God has given is meant to be used for other people, and it does not all look the same.",
      text: "Peter writes with the end of all things near. He calls for sober prayer, earnest love, and hospitality without grumbling. Each person is to use whatever gift they have received to serve others, as a steward of God’s varied grace. Speech and service are to rely on the strength God supplies, so that God is glorified through Jesus Christ.",
      interpretation: "This is an early look at service, not a completed calling and not Level 4 of the longer path. A trusted person’s feedback can help you notice an ability you overlook. No personality inventory, and no group leader, can assign a divine life calling. Service includes quiet practical work. It is not limited to public leadership. Limits are part of faithful stewardship.",
      practiceNote: "One possible practice is to ask one trusted person where they already see you helping, then offer one modest act of service. Their answer is counsel, not a prophecy.",
      prompts: [
        "How do prayer, love, hospitality, and gifts fit together in this passage?",
        "Who benefits when gifts are used as Peter describes?",
        "What ability do you overlook because it seems ordinary?",
        "Where does your workplace or community need service rather than self-promotion?",
        "How can you serve in God’s strength while still honoring your limits?"
      ],
      prayer: "Thank God for the gifts you see in others, and ask where yours might meet a real need.",
      action: "Ask one trusted person where they see you helping others. Then offer one modest act of service that fits your time and strength. You do not need to announce a calling.",
      caution: ""
    },
    {
      n: 9,
      section: "Fitness",
      title: "Steward the body you have",
      passage: "1 Timothy 4:7–10",
      passageLoad: "1 Timothy 4:7-10",
      passageNote: "Read from verse 7 so you hear what Paul sets physical training beside. He is talking about training in godliness, not about a workout plan.",
      keyVerse: "1 Timothy 4:8",
      translation: "NIV",
      plainSense: "Caring for the body has a real but limited value. Godliness reaches further than a training plan.",
      text: "Paul tells Timothy to refuse irreverent myths and to train in godliness. He says bodily training is of some value, while godliness is valuable in every way, holding promise for this life and the life to come. The saying is trustworthy. Their toil and striving are set on the living God, who is the Savior of all people, especially of those who believe.",
      interpretation: "Rest, appropriate movement, nourishment, and needed medical care are applications of stewardship. They are not a fitness program prescribed by this passage, and this course does not promise a health outcome. Disability, illness, body size, and athletic ability do not measure spiritual maturity. Do not compare bodies, hold a weigh-in, or give medical advice. A man with limits can practice faithfulness without matching someone else’s capacity.",
      practiceNote: "One possible practice is a single accessible act of care that fits the body you actually have: rest, gentle movement, or arranging care you already know you need.",
      prompts: [
        "What value does Paul recognize in physical training, and what does he treat as greater?",
        "How is caring for your body different from making appearance or performance your identity?",
        "Which need deserves attention: rest, movement, nourishment, medical care, or freedom from comparison?",
        "How might a limitation change the practice without reducing someone’s faithfulness?",
        "What sustainable step would help you care for the body you have?"
      ],
      prayer: "Thank God for embodied life, and ask for freedom from shame and from neglect.",
      action: "Choose one accessible practice that fits your health: an earlier night of rest, a gentle walk or mobility you can do, or making an appointment or asking for help you have been postponing. Stop if something causes pain, and follow the guidance of your own clinician for medical decisions.",
      caution: "This is not medical advice, a training plan, or a promise about weight, strength, or health. Do not stop prescribed care because of this lesson."
    },
    {
      n: 10,
      section: "Finances",
      title: "Contentment and open hands",
      passage: "1 Timothy 6:6–10 and 6:17–19",
      passageLoad: "1 Timothy 6:6-10",
      passageAlso: "1 Timothy 6:17-19",
      passageNote: "Read both sections. The warning about craving wealth and the instruction to people who have resources belong together. Do not type private dollar amounts into this app.",
      keyVerse: "1 Timothy 6:7",
      translation: "NIV",
      plainSense: "We do not bring possessions into the world with us, and we do not take them when we leave.",
      text: "Paul says godliness with contentment is great gain. We brought nothing into the world and can take nothing out. Food and clothing are enough to be content. Those who desire to be rich fall into temptation. The love of money is a root of all kinds of evils. Later he tells people who are rich not to be haughty or to set their hope on wealth, but on God, and to be rich in good works, generous, and ready to share.",
      interpretation: "A private look at spending can support honesty. This passage does not prescribe a budget, a percentage, or an investment, and it does not promise that generosity will make someone wealthy. Poverty is not proof of moral failure. Wealth is not proof of faithfulness. Do not solicit loans, investments, or gifts for a leader, and do not ask anyone to disclose numbers.",
      practiceNote: "One possible practice is a private review of one week of spending and a single realistic step: make a simple plan, set something aside, ask a qualified person for help, or give within your actual responsibilities.",
      prompts: [
        "What dangers does Paul name in craving wealth and putting hope in it?",
        "What does he tell people who have resources to do?",
        "Where does comparison make contentment difficult for you?",
        "What could wise generosity look like within your actual means and responsibilities?",
        "What next step would increase honesty or peace about money without exposing private numbers?"
      ],
      prayer: "Ask for daily provision, for contentment, and for generous wisdom rather than fear.",
      action: "Privately review one week of spending where you already keep those records. Choose one realistic step: a simple plan, saving something small, asking a qualified helper, or giving an amount you can actually release. Do not enter amounts here, and do not share account details with the group.",
      caution: "Nothing in this week is financial advice or a promise about money. Do not lend to, invest with, or give money to the facilitator because of this lesson."
    },
    {
      n: 11,
      section: "Purpose",
      title: "Discern the next faithful step",
      passage: "Romans 12:1–8",
      passageLoad: "Romans 12:1-8",
      passageNote: "Read from the appeal of verse 1 through the differing gifts in verse 8. Mercy comes before the response.",
      keyVerse: "Romans 12:4",
      translation: "NIV",
      plainSense: "One body has many members, and they are not all given the same function.",
      text: "Paul appeals to the readers, by the mercies of God, to present their bodies as a living sacrifice, which is their spiritual worship. He tells them not to be conformed to this world but to be transformed by the renewal of the mind, so they may discern God’s will. He warns against thinking of oneself more highly than one ought. The body has many members with different gifts, and those gifts are to be used.",
      interpretation: "A sentence about this season can clarify a next step. It is not a prophecy, not a discovery of a hidden life plan, and not an announcement that God has assigned a permanent mission. Test impressions against Scripture, wise counsel, the responsibilities you already carry, and their fruit over time. Across God, family, work, the body, and money, look for ordinary obedience rather than a dramatic calling.",
      practiceNote: "One possible practice is to write, “In this season, I can serve ___ by ___.\" Discuss it with a trusted believer. The blank is a hypothesis to test, not a vow or a rank.",
      prompts: [
        "How does Paul’s appeal rest on God’s mercy rather than on self-improvement alone?",
        "How are a renewed mind, humility, and different gifts connected?",
        "Across these weeks, where is one obedient step becoming clearer?",
        "What recurring need, ability, or trustworthy feedback could help you discern a next step?",
        "What small step can you test with prayer and counsel instead of declaring a lifelong mission?"
      ],
      prayer: "Offer your ordinary life to God, and ask for humility, discernment, and courage.",
      action: "Write one sentence for this season: who you can serve, and how, in a way that fits your real limits. Share it with a trusted believer if you want counsel. Do not treat the sentence as a revelation.",
      caution: "No one in this group can tell you your divine life assignment. Hold impressions humbly and test them."
    },
    {
      n: 12,
      section: "Purpose",
      title: "Sent together, not finished",
      passage: "Matthew 28:16–20",
      passageLoad: "Matthew 28:16-20",
      passageNote: "Read the whole scene, including the doubt in verse 17 and the promise at the end.",
      keyVerse: "Matthew 28:20",
      translation: "NIV",
      plainSense: "The risen Jesus sends his disciples and promises that his presence will go with them.",
      text: "The eleven go to the mountain Jesus had directed. When they see him, they worship, and some doubt. Jesus says all authority in heaven and on earth has been given to him. He sends them to make disciples of all nations, baptizing them and teaching them to obey what he commanded. He promises to be with them always, to the end of the age.",
      interpretation: "A plan for the next month can support discipleship. It is not the commission itself, and it does not make the group into a church. Completing these 12 weeks does not qualify anyone to lead, baptize, or speak for a congregation. Worship and doubt stand side by side in the text, so uncertainty does not eject a man from the story. Men who want to talk about faith or baptism should be connected with a local pastor. This course does not speak for North Coast Church or any other church.",
      practiceNote: "One possible practice is a 30-day plan with one Scripture rhythm, one ongoing relationship, and one person to serve or invite without pressure.",
      prompts: [
        "What do you notice about worship and doubt among the disciples?",
        "How do Jesus’ authority and presence frame the commission?",
        "What has changed in the way you read Scripture or respond to Jesus?",
        "Who could you love, serve, or invite into an honest conversation about faith, without pressure?",
        "What relationships and practices will help you continue over the next month?"
      ],
      prayer: "Thank God for the men in your group, and ask for continued courage, love, and dependence on Jesus.",
      action: "Write a simple plan for the next 30 days: one way you will keep opening Scripture, one relationship you will keep showing up for, and one person you might serve or invite. Finishing the plan does not make you a leader.",
      caution: "Marking this week complete does not open Level 2, confer a spiritual rank, or certify you to lead a group."
    }
  ];

  /* Same five movements every week. The words under each one change with the passage.
     Nothing here is a note to store, a score, or a claim that the mentor confirmed attendance. */
  var MENTOR_AGENDA = [
    { key: "scripture", label: "Scripture", hint: "Read the week's passage. Keep what it says separate from what you think it means." },
    { key: "application", label: "Real-life application", hint: "Ask how this touches his actual week. Do not invent an outcome the passage does not promise." },
    { key: "challenges", label: "Challenges", hint: "Ask what is hard. He may pass. Do not require a confession or a private detail." },
    { key: "prayer", label: "Prayer", hint: "Pray only for what he wants included. Silent prayer counts. Do not record the prayer." },
    { key: "nextStep", label: "One next step", hint: "Agree on one step he can actually take. Leave the wording between you. Do not type it here." }
  ];
  var MENTOR_BY_WEEK = {
    1: {
      scripture: "Read 2 Timothy 3:14–17. Ask what Paul says Scripture does, and where faith in Christ fits. Look up Psalm 119:105 if you want the key verse in a Bible.",
      application: "Ask what reading rhythm would be small enough to keep. A rhythm you suggest is not a rule this passage commands.",
      challenges: "Leave room for a question or a doubt about the Bible. Not knowing is allowed. Do not invent an answer you do not have.",
      prayer: "Ask God for a teachable heart. Praying aloud is optional.",
      nextStep: "Let him name one step, such as reading the passage on three days and keeping one observation, one question, and one response.",
      limit: "Do not grade his Bible knowledge or treat a question as resistance."
    },
    2: {
      scripture: "Read Ephesians 2:1–10, including the mercy before the good works. Ask how grace, faith, and works are ordered.",
      application: "Ask where he feels he must earn his worth. Good work follows the gift in this passage. It does not reveal a hidden career.",
      challenges: "If he is unsure what he believes, let him say so. Do not ask him to pretend he has already trusted Christ.",
      prayer: "Thank God for mercy, and ask for help receiving grace instead of performing for it.",
      nextStep: "One moment this week when he notices performance-based worth, then a rereading of Ephesians 2:8–10.",
      limit: "Do not announce a calling, a rank, or a life plan from this conversation."
    },
    3: {
      scripture: "Read John 15:1–12. Stay with what Jesus says it means to remain, and what he says fruit depends on.",
      application: "Ask where busyness stands in for attention to Jesus. Fruit here is not money, status, or a visible ministry score.",
      challenges: "Ask what makes an ordinary day feel disconnected from him. Do not prescribe a long devotional system.",
      prayer: "Ask for dependence in the place where self-reliance has taken over.",
      nextStep: "If he wants it, a few unrushed minutes with a few lines of John 15. Stopping while he is still attentive is enough.",
      limit: "Do not measure his faithfulness by how much he produces."
    },
    4: {
      scripture: "Read James 1:19–27 so listening, speech, anger, and care for people in distress stay together.",
      application: "Help him choose one response he can actually practice. One response does not earn salvation.",
      challenges: "Ask where talking about obedience is easier than doing it. Do not expand one step into fixing his whole life.",
      prayer: "Ask for courage to act and for humility to listen before speaking.",
      nextStep: "One of these, chosen by him: listen well, restrain speech, or one practical act of care.",
      limit: "Your preferred habits are not the same thing as the text's instructions."
    },
    5: {
      scripture: "Read Colossians 3:12–17. Notice the identity Paul names before the list of qualities.",
      application: "Ask who the people closest to him actually are. Do not assume a wife or children. A single, widowed, divorced, or childless man can practice this.",
      challenges: "Ask which quality is hard. Patience is not the same as avoiding a needed conversation. Forgiveness is not a return to harm.",
      prayer: "Ask for compassion and for wisdom about healthy boundaries.",
      nextStep: "One act of care that does not demand thanks. If a relationship is unsafe, the step is a different person or a wise boundary, not contact.",
      limit: "Do not urge him to reconcile with someone who has harmed him, or to control the people in his home."
    },
    6: {
      scripture: "Read Romans 12:9–21, including the limits in verse 18. Peace includes doing his part and admitting what he does not control.",
      application: "Ask what he can own, and what is outside his control. An apology may help. A reconciled outcome cannot be demanded.",
      challenges: "Do not treat abuse as a mutual communication problem, and do not send him to confront someone alone.",
      prayer: "Ask for humility about his own part, and for wisdom about safety.",
      nextStep: "One safe step: listen, a specific apology for something he did, or qualified guidance before any contact.",
      limit: "If someone may be in danger, the step is appropriate help, not a private confrontation. In the U.S., call 911 for immediate danger and 988 for a mental-health crisis."
    },
    7: {
      scripture: "Read Colossians 3:22–4:1. Name who is addressed, including the justice Paul requires of masters.",
      application: "Ask where integrity fits his paid work, caregiving, study, search for work, or volunteering. This is not an endorsement of slavery and not a command to endure unsafe work.",
      challenges: "Ask where approval, overwork, or unfairness shows up. A person's dignity does not depend on having a job.",
      prayer: "Ask for integrity in ordinary tasks and for justice where he has influence.",
      nextStep: "One overlooked responsibility finished well, or one realistic step toward needed work. If the workplace is unsafe, the step may be to seek help.",
      limit: "Do not use this passage to excuse coercion, exploitation, or unsafe conditions."
    },
    8: {
      scripture: "Read 1 Peter 4:7–11 so prayer, love, hospitality, and gifts stay together.",
      application: "Ask what ordinary ability he overlooks. You may notice a pattern. You cannot assign a divine calling.",
      challenges: "Ask where service would help without becoming self-promotion. Limits are part of faithful stewardship.",
      prayer: "Thank God for gifts he sees in others, and ask about one real need.",
      nextStep: "He asks one trusted person where they already see him helping, then offers one modest act of service. Their answer is counsel, not a prophecy.",
      limit: "This conversation is not Level 4 and not a life assignment."
    },
    9: {
      scripture: "Read 1 Timothy 4:7–10. Paul is pressing training in godliness. Bodily training has a real but limited value.",
      application: "Ask what care fits the body he actually has: rest, gentle movement, nourishment, or arranging care. Do not compare bodies or hold a weigh-in.",
      challenges: "Shame, neglect, illness, or a limitation can all be named. None of them is a measure of faithfulness. You are not his clinician.",
      prayer: "Thank God for embodied life, and ask for freedom from shame and from neglect.",
      nextStep: "One accessible practice he chooses. Pain is a reason to stop, not a test of commitment.",
      limit: "Give no medical advice, no training plan, and no promised health result. Do not tell him to stop prescribed care."
    },
    10: {
      scripture: "Read 1 Timothy 6:6–10 and 6:17–19. Keep the warning about craving wealth together with the call to generosity.",
      application: "Ask what honesty or peace about money could look like without any numbers. Do not prescribe a budget or promise that giving will make him wealthy.",
      challenges: "Comparison, fear, and pressure can be named in general. Poverty is not moral failure. Do not ask for a loan, an investment, or a gift.",
      prayer: "Ask for daily provision, contentment, and generous wisdom rather than fear.",
      nextStep: "A private review in records he already keeps, and one realistic step he does not have to describe with amounts.",
      limit: "Do not ask for dollar amounts, account details, or a financial disclosure. This is not financial advice."
    },
    11: {
      scripture: "Read Romans 12:1–8. Mercy comes before the appeal. Then a renewed mind, humility, and different gifts.",
      application: "Looking across these weeks, ask where one obedient step is becoming clearer. A sentence for this season is a hypothesis to test, not a prophecy.",
      challenges: "The pressure to declare a permanent mission. Test impressions against Scripture, wise counsel, and the responsibilities he already carries.",
      prayer: "Offer ordinary life to God, and ask for humility, discernment, and courage.",
      nextStep: "He may say, out loud, who he can serve and how. You do not record the sentence, and you do not confirm it as God's hidden plan.",
      limit: "You cannot tell him his divine life assignment."
    },
    12: {
      scripture: "Read Matthew 28:16–20, including the doubt in verse 17 and the promise of Jesus' presence.",
      application: "Ask what has changed in how he reads Scripture or responds to Jesus. A plan for the next month supports discipleship. It is not the commission and not a license to lead.",
      challenges: "He may want to feel finished, or he may fear that doubt disqualifies him. Interest in faith or baptism belongs with a local pastor. This meeting does not speak for a church.",
      prayer: "Thank God for the men in the group, and ask for continued courage, love, and dependence on Jesus.",
      nextStep: "One Scripture rhythm, one relationship to keep, and one person to serve or invite without pressure.",
      limit: "Do not tell him he is ready to lead a group. Marking this meeting does not open Level 2 or certify anyone."
    }
  };
  WEEKS.forEach(function (week) { week.mentor = MENTOR_BY_WEEK[week.n]; });

  var MEETING_MODES = ["in-person", "zoom"];

  function emptySteps() {
    var steps = {};
    for (var n = 1; n <= WEEKS.length; n++) {
      steps[n] = { read: false, reflect: false, pray: false, practice: false };
    }
    return steps;
  }

  function emptyMeetings() {
    var meetings = {};
    for (var n = 1; n <= WEEKS.length; n++) meetings[n] = { mode: "", met: false };
    return meetings;
  }

  function meetingMode(value) {
    return value === "in-person" || value === "zoom" ? value : "";
  }

  /* Lesson booleans stay on the step. Meeting mode and the self-reported
     met flag are kept beside them. Notes, names, links, and other keys are dropped.
     The meetings column wins, including an explicit uncheck or a cleared mode.
     A nested steps[].meeting wins only when it has a later `at`, which is how a
     write that could not update the column records a newer false. */
  function readMeeting(raw, n) {
    var bag = raw && raw.meetings ? raw.meetings : {};
    var steps = raw && raw.steps ? raw.steps : {};
    var row = steps[n] || steps[String(n)] || {};
    var nested = row.meeting && typeof row.meeting === "object" ? row.meeting : null;
    var direct = bag[n] || bag[String(n)];
    if (!direct || typeof direct !== "object") direct = null;
    var chosen = direct;
    if (nested) {
      var nestedAt = typeof nested.at === "string" ? nested.at : "";
      var directAt = direct && typeof direct.at === "string" ? direct.at : "";
      if (!direct || (nestedAt && nestedAt > directAt)) chosen = nested;
    }
    if (chosen) return { mode: meetingMode(chosen.mode), met: chosen.met === true };
    return { mode: meetingMode(row.mentorMode), met: row.mentorMet === true };
  }

  function normalize(raw) {
    var steps = emptySteps();
    var meetings = emptyMeetings();
    var src = raw && typeof raw === "object" ? raw : {};
    var stepSrc = src.steps || {};
    for (var n = 1; n <= WEEKS.length; n++) {
      var row = stepSrc[n] || stepSrc[String(n)] || {};
      STEP_KEYS.forEach(function (key) {
        steps[n][key] = row[key] === true;
      });
      meetings[n] = readMeeting(src, n);
    }
    return {
      programId: PROGRAM_ID,
      optedIn: src.optedIn === true,
      updatedAt: typeof src.updatedAt === "string" ? src.updatedAt : "",
      steps: steps,
      meetings: meetings
    };
  }

  function weekByNumber(n) {
    return WEEKS.filter(function (w) { return w.n === n; })[0] || null;
  }

  function weekCoreComplete(state, n) {
    var s = normalize(state).steps[n];
    if (!s) return false;
    return STEP_KEYS.every(function (key) { return s[key] === true; });
  }

  function weeksCheckedCount(state) {
    var count = 0;
    for (var n = 1; n <= WEEKS.length; n++) if (weekCoreComplete(state, n)) count++;
    return count;
  }

  function courseCoreComplete(state) {
    return weeksCheckedCount(state) === WEEKS.length;
  }

  function weekMeetingComplete(state, n) {
    var meeting = normalize(state).meetings[n];
    return !!(meeting && meeting.met === true);
  }

  function meetingsMarkedCount(state) {
    var count = 0;
    for (var n = 1; n <= WEEKS.length; n++) if (weekMeetingComplete(state, n)) count++;
    return count;
  }

  function weeksWithBothCount(state) {
    var count = 0;
    for (var n = 1; n <= WEEKS.length; n++) {
      if (weekCoreComplete(state, n) && weekMeetingComplete(state, n)) count++;
    }
    return count;
  }

  function levelById(id) {
    return LEVELS.filter(function (l) { return l.id === id; })[0] || null;
  }

  function levelAvailable(id) {
    var level = levelById(id);
    return !!(level && level.available === true && level.id === 1);
  }

  /* Completing the 12 weeks never promotes, ranks, or certifies. */
  function promotion() {
    return { promoted: false, rank: null, certifiedLeader: false, nextLevel: null, openLevels: [1] };
  }

  function publicSnapshot(raw) {
    var state = normalize(raw);
    var weeks = {};
    var meetings = {};
    for (var n = 1; n <= WEEKS.length; n++) {
      weeks[n] = state.steps[n];
      meetings[n] = { mode: state.meetings[n].mode, met: state.meetings[n].met };
    }
    return {
      programId: PROGRAM_ID,
      optedIn: state.optedIn,
      weeksChecked: weeks,
      meetings: meetings,
      weeksComplete: weeksCheckedCount(state),
      meetingsMarked: meetingsMarkedCount(state),
      weeksWithBoth: weeksWithBothCount(state),
      coreComplete: courseCoreComplete(state),
      promoted: false,
      certifiedLeader: false,
      rank: null,
      openLevels: [1]
    };
  }

  function shareLine(raw) {
    var snap = publicSnapshot(raw);
    if (!snap.optedIn) return "Level 1 is available to begin. No check-in is recorded.";
    return "Level 1: " + snap.weeksComplete + " of " + WEEKS.length + " lesson weeks and " + snap.meetingsMarked + " of " + WEEKS.length + " self-reported mentor meetings. No rank or leadership status is attached.";
  }

  return {
    PROGRAM_ID: PROGRAM_ID,
    STEP_KEYS: STEP_KEYS,
    MEETING_MODES: MEETING_MODES,
    MENTOR_AGENDA: MENTOR_AGENDA,
    LEVELS: LEVELS,
    WEEKS: WEEKS,
    title: "Rooted and Ready",
    emptySteps: emptySteps,
    emptyMeetings: emptyMeetings,
    normalize: normalize,
    weekByNumber: weekByNumber,
    weekCoreComplete: weekCoreComplete,
    weekMeetingComplete: weekMeetingComplete,
    weeksCheckedCount: weeksCheckedCount,
    meetingsMarkedCount: meetingsMarkedCount,
    weeksWithBothCount: weeksWithBothCount,
    courseCoreComplete: courseCoreComplete,
    levelAvailable: levelAvailable,
    promotion: promotion,
    publicSnapshot: publicSnapshot,
    shareLine: shareLine
  };
});
