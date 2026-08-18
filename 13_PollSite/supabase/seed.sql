-- =============================================================================
-- Seed data for `polls`, extracted VERBATIM from the current artifact source
-- (poll-prototype.jsx, POLLS array) -- not reconstructed from memory.
-- Run after schema.sql. Safe to re-run (upsert on id).
--
-- Note p18 stays status='draft' intentionally -- see the governance comment
-- in the source artifact: it's the military-deployment poll held back
-- because its original framing leaned on unsourced "this week" news
-- coverage. Do not flip it to 'published' without a deliberate decision.
--
-- Note p19 (World Cup) is seeded as status='archived', NOT 'published' as
-- it appears in the artifact source. The artifact was written when the
-- 2026 World Cup hadn't concluded yet; by the time of this deployment
-- (2026-08-16), the tournament final already happened (July 19). The
-- artifact's expiresAt of 2026-07-20 was correct at authoring time but the
-- content itself is now stale on substance, not just past its window --
-- publishing it live would have silently rejected every vote with
-- poll_expired while still rendering as a normal votable poll in the UI.
-- If you want a World Cup poll again, write a new one in past tense
-- ("did you watch...") rather than reviving this one.
-- =============================================================================

insert into polls (id, category, question, choices, status, featured, source_label, source_url, promotion, expires_at)
values
('p1', 'politics', 'Should local elections be held on weekends to boost turnout?', '["Yes","No","Only for major elections","Not sure"]', 'published', false, null, null, null, null),
('p2', 'politics', 'Is ranked-choice voting a good idea for your state?', '["Yes","No","Need to learn more","Doesn''t matter to me"]', 'published', false, null, null, null, null),
('p3', 'health', 'Do you track your sleep with an app or wearable?', '["Every night","Sometimes","Used to, stopped","Never"]', 'published', false, null, null, null, null),
('p4', 'health', 'What''s your biggest barrier to eating healthier?', '["Cost","Time","Motivation","Not sure what''s actually healthy"]', 'published', false, null, null, null, null),
('p5', 'trending', 'Are AI-generated images ruining social feeds?', '["Yes, mostly","No, they''re fine","Depends on the use","Haven''t noticed"]', 'published', false, null, null, null, null),
('p6', 'trending', 'Four-day work week: would you take a pay cut for it?', '["Yes, gladly","No, need full pay","Small cut only","Prefer 5 days"]', 'published', false, null, null, null, null),
('p7', 'social', 'Which platform has the best discovery algorithm right now?', '["TikTok","Instagram","YouTube","X"]', 'published', false, 'Ongoing creator debate across platforms, not tied to one post', null, null, null),
('p8', 'social', 'Do you trust product reviews you see on social media?', '["Yes, usually","Rarely","Only from creators I follow","Never"]', 'published', false, null, null, null, null),
('p9', 'home', 'Would you pay $19 for a tool that helps you document your home''s condition, room by room?', '["Yes","No","Maybe, depends what''s included","I''d want it free"]', 'published', false, null, null, '{"label":"If this is on your mind: The Homeowner''s Property Record Kit","url":"https://www.getwholeclaim.com"}', null),
('p10', 'home', 'Have you ever wished you''d documented your home''s condition before something went wrong?', '["Yes","No","Never thought about it","I already do this"]', 'published', false, null, null, '{"label":"If this is on your mind: The Homeowner''s Property Record Kit","url":"https://www.getwholeclaim.com"}', null),
('p11', 'home', 'What worries you most about a home renovation project?', '["Cost overruns","Finding a trustworthy contractor","Timeline delays","Permits/inspections"]', 'published', false, null, null, null, null),
('p12', 'sports', 'Should college athletes be paid a salary by their schools?', '["Yes","No","Only revenue sports","NIL deals are enough"]', 'published', false, null, null, null, null),
('p13', 'sports', 'Are award shows still relevant to how you discover new shows/movies?', '["Yes","No","Only for buzz, not decisions","I don''t watch them"]', 'published', false, null, null, null, null),
('p14', 'trending', 'When a post claims a common habit is ''secretly ruining your productivity,'' do you believe claims like this without a source?', '["No, I want a source","Sometimes, if it sounds plausible","Yes, if enough people agree","I ignore these posts"]', 'published', false, 'General pattern seen in productivity-hack virality, not tied to one post', null, null, null),
('p15', 'health', 'Would you trust a symptom-checker app over calling a doctor''s office?', '["Yes, for minor things","No, always call","Only to decide if I should call","Never used one"]', 'published', false, null, null, null, null),
('p16', 'trending', 'Internet nostalgia cycles come back often — does that say something real about how people feel about right now?', '["Yes, it''s a mood signal","No, it''s just a content format","A bit of both","Haven''t noticed the trend"]', 'published', true, 'Recurring nostalgia-cycle pattern across TikTok/Instagram, not tied to one post', null, null, null),
('p17', 'trending', 'Should companies have to tell you when AI, not a person, made a decision about you (hiring, a loan, a claim)?', '["Yes, always disclose","Only for major decisions","No, doesn''t matter how it''s made","Not sure"]', 'published', false, null, null, null, null),
('p18', 'politics', 'Should military deployment lengths be fixed in advance, or flexible based on need?', '["Fixed, set in advance","Flexible based on need","Depends on the mission","Not sure"]', 'draft', false, null, null, null, null),
('p19', 'sports', 'The 2026 World Cup is being hosted across the US, Canada, and Mexico — are you planning to watch?', '["Yes, in person if I can","Yes, on TV/streaming","I''ll catch highlights only","Not really into it"]', 'archived', false, null, null, null, '2026-07-20T00:00:00Z'),
('p20', 'social', 'During fashion week season, do you actually follow runway shows, or just the recap posts?', '["I watch full shows","Just recaps/highlights","Only if a favorite creator covers it","Don''t follow fashion week at all"]', 'published', false, null, null, null, '2026-10-10T00:00:00Z'),
('p21', 'trending', 'During back-to-school season, what stresses you out most?', '["Cost of supplies/clothes","Schedule/childcare logistics","Screen time & social media rules","Nothing, we''re in a good routine"]', 'published', false, null, null, null, '2026-09-20T00:00:00Z'),
('p22', 'sports', 'Should college football expand the playoff again, or is the current format enough?', '["Expand it further","Current format is fine","Actually roll it back","Don''t follow college football"]', 'published', false, null, null, null, null),
('p23', 'social', 'Are you more likely to try a product after seeing it in a ''worth every penny'' style list than a traditional ad?', '["Yes, much more likely","No difference to me","No, I trust ads more","I ignore both"]', 'published', false, 'Reflects a recurring list-style trend on TikTok/Instagram, not tied to one post', null, null, null)
on conflict (id) do update set
  category = excluded.category,
  question = excluded.question,
  choices = excluded.choices,
  status = excluded.status,
  featured = excluded.featured,
  source_label = excluded.source_label,
  source_url = excluded.source_url,
  promotion = excluded.promotion,
  expires_at = excluded.expires_at;


-- =============================================================================
-- Batch 2 + 3, added 2026-08-17. Regenerated from the database so file and
-- live table cannot drift. Status per row is authoritative.
-- p31/p33/p47 carry FIVE choices deliberately (opt-out); nothing assumes four.
-- p35/p36 expire the day after the 2026 midterms.
-- =============================================================================

insert into polls (id, category, question, choices, status, featured, source_label, source_url, promotion, expires_at)
values
('p24', 'politics', 'Do you think a strong third party would help or hurt American politics?', '["Help — more choices","Hurt — split the vote","No difference","Not sure"]', 'published', false, null, null, null, null),
('p25', 'politics', 'Would you ever vote for a candidate from the ''other'' party if you liked them personally?', '["Yes, personality matters more","No, party matters more","Depends on the race","Never thought about it"]', 'draft', false, null, null, null, null),
('p26', 'politics', 'Do you think party loyalty gets in the way of good decision-making in Congress?', '["Yes, too much","Somewhat","No, it''s necessary for functioning government","Not sure"]', 'draft', false, null, null, null, null),
('p27', 'politics', 'Should there be term limits for members of Congress?', '["Yes, for everyone","Only for leadership positions","No","Not sure"]', 'published', false, null, null, null, null),
('p28', 'politics', 'Are you more skeptical of your own party''s leadership or the other party''s?', '["My own party''s","The other party''s","Equally skeptical of both","I don''t have a party"]', 'draft', false, null, null, null, null),
('p29', 'politics', 'Is it more important for a politician to compromise or to stick firmly to their principles?', '["Compromise gets things done","Stick to principles","Depends on the issue","Not sure"]', 'published', false, null, null, null, null),
('p30', 'politics', 'Do you think most people vote based on the candidate or based on the party label?', '["The candidate","The party label","A mix of both","Not sure"]', 'draft', false, null, null, null, null),
('p31', 'politics', 'Do you trust how federal agencies are used around elections?', '["Yes, I trust it","No — too much interference","No — they don''t do enough to protect elections","Depends on the specifics","Not sure"]', 'draft', false, null, null, null, null),
('p32', 'politics', 'Do you think the federal government is acting in the country''s best interest economically?', '["Yes","No","Mixed","Not sure"]', 'draft', false, null, null, null, null),
('p33', 'politics', 'Who do you think has more influence over grocery and gas prices?', '["Republicans","Democrats","Neither — global/economic factors","Both equally","Not sure"]', 'draft', false, null, null, null, null),
('p34', 'home', 'Do you think oil and gas company profits are the main driver of what you pay at the pump?', '["Yes","No, other costs matter more","Somewhat","Not sure"]', 'published', false, null, null, null, null),
('p35', 'politics', 'Who do you think wins control of the House in the 2026 midterms?', '["Republicans","Democrats","Too close to call","Not following it"]', 'published', false, null, null, null, '2026-11-04T00:00:00+00:00'),
('p36', 'politics', 'Who do you think wins control of the Senate in the 2026 midterms?', '["Republicans","Democrats","Too close to call","Not following it"]', 'published', false, null, null, null, '2026-11-04T00:00:00+00:00'),
('p37', 'trending', 'Would you want a large data center built near where you live?', '["Yes — jobs and tax revenue","No — strain on resources","Depends on the details","Not sure"]', 'published', false, null, null, null, null),
('p38', 'trending', 'Do you think data centers are worth the strain they put on local water and power?', '["Yes, worth it","No, not worth it","Depends on the location","Not sure"]', 'published', false, null, null, null, null),
('p39', 'trending', 'Should states offer big tax breaks to attract data centers?', '["Yes, brings investment","No, costs outweigh benefits","Only with strict conditions","Not sure"]', 'published', false, null, null, null, null),
('p40', 'trending', 'Who should pay for the extra power/water infrastructure data centers require?', '["The tech companies","Taxpayers, it''s worth the investment","Split the cost","Not sure"]', 'published', false, null, null, null, null),
('p41', 'trending', 'Are you worried AI''s growing energy demand will raise your electricity bill?', '["Yes, very worried","A little concerned","Not worried","Haven''t thought about it"]', 'published', false, null, null, null, null),
('p42', 'social', 'Is it ever okay to look at your phone during a first date?', '["Never","Only to split the bill/check something quick","Depends on the person","No big deal"]', 'published', false, null, null, null, null),
('p43', 'sports', 'Do you think reality TV drama is mostly real or mostly scripted?', '["Mostly real","Mostly scripted","A mix","Don''t watch it"]', 'published', false, null, null, null, null),
('p44', 'social', 'Would you date someone with a very different political view than you?', '["Yes, no problem","No, dealbreaker","Depends how strongly they feel about it","Never thought about it"]', 'published', false, null, null, null, null),
('p45', 'social', 'Is it rude to leave someone on ''read'' for more than a day?', '["Yes, rude","No, people are busy","Depends on the relationship","Never noticed/cared"]', 'published', false, null, null, null, null),
('p46', 'social', 'Do you think influencers should have to disclose every paid partnership?', '["Yes, always","Only above a certain size/reach","No, it''s their business","Not sure"]', 'published', false, null, null, null, null),
('p47', 'sports', 'Is it more impressive to be a great scorer or a great playmaker?', '["Scorer","Playmaker","Both equally","Depends on the era","Not sure"]', 'draft', false, null, null, null, null),
('p48', 'sports', 'Should college athletes be treated as employees with the right to unionize?', '["Yes, they''re workers","No, they''re students first","Only at big programs","Not sure"]', 'published', false, null, null, null, null),
('p49', 'sports', 'Do you think streaming has made movies and TV better or worse overall?', '["Better","Worse","About the same","Depends on the platform"]', 'published', false, null, null, null, null),
('p50', 'sports', 'Is a team more exciting when one superstar carries it, or when it''s built around a deep roster?', '["One superstar","Deep roster","Depends on the sport","Not sure"]', 'published', false, null, null, null, null),
('p51', 'sports', 'Should awards shows factor in an artist''s personal controversies when deciding winners?', '["Yes","No, only the art matters","Depends on severity","Not sure"]', 'published', false, null, null, null, null)
on conflict (id) do update set
  category = excluded.category,
  question = excluded.question,
  choices = excluded.choices,
  status = excluded.status,
  featured = excluded.featured,
  source_label = excluded.source_label,
  source_url = excluded.source_url,
  promotion = excluded.promotion,
  expires_at = excluded.expires_at;
