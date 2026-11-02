/* e.casino anonymous gambling self-check (original questions; runs only in the browser). © e.casino */
(function () {
  "use strict";
  var EC = window.EC, $ = EC.$;
  var Q = [
    "Do you gamble with money you had set aside for bills, savings or essentials?",
    "Do you find yourself raising your stakes to keep it exciting?",
    "After losing, do you feel an urge to keep playing or come back soon to win it back?",
    "Have you borrowed, used credit, or sold belongings to gamble or to cover gambling losses?",
    "Do you spend more time gambling than you planned to?",
    "Do you feel restless, irritable or low when you try to cut back?",
    "Do you keep how much you gamble secret from people close to you?",
    "Has gambling affected your work, studies, sleep or relationships?",
    "Do you gamble to escape stress, boredom or difficult feelings?",
    "Have you tried to stop or cut back and found it hard?"
  ];
  var OPTS = ["Never", "Sometimes", "Often", "Almost always"];
  $("#sc-qs").innerHTML = Q.map(function (q, i) {
    return '<fieldset class="quiz-q"><legend>' + (i + 1) + ". " + q + '</legend><div class="opts">' + OPTS.map(function (o, v) {
      return '<label><input type="radio" name="q' + i + '" value="' + v + '"> ' + o + "</label>"; }).join("") + "</div></fieldset>";
  }).join("");
  $("#sc-go").addEventListener("click", function () {
    var score = 0, missing = 0;
    Q.forEach(function (_, i) { var c = document.querySelector('input[name="q' + i + '"]:checked'); if (c) score += +c.value; else missing++; });
    if (missing) { $("#sc-result").innerHTML = '<div class="form-status err" style="display:block">Please answer all ' + Q.length + " questions (" + missing + " left).</div>"; return; }
    var help = '<a href="' + EC.root + 'responsible-gaming/#help">free, confidential helplines</a>';
    var band = score === 0 ? ["badge-brand", "No warning signs right now", "Your answers don't show warning signs. Keep it that way: set a budget before you play, treat losses as the price of entertainment, and never chase. Revisit this check now and then."]
      : score <= 5 ? ["badge-gold", "Some early warning signs", "A few of your answers suggest gambling is starting to take more than you intended. This is a great moment to set firm limits, use deposit and time limits, and talk to someone you trust. Our " + '<a href="' + EC.root + 'learn/setting-gambling-budget/">budgeting guide</a> can help.']
      : score <= 12 ? ["badge-red", "Moderate warning signs", "Your answers suggest gambling may be causing real harm. You don't have to handle it alone — a short, confidential conversation with a helpline adviser can help you decide on next steps. Consider self-exclusion and blocking tools too. See " + help + "."]
      : ["badge-red", "Strong warning signs — please reach out", "Your answers suggest gambling is causing serious problems. Please contact one of the " + help + " today; they are free, confidential and available 24/7. Blocking tools and self-exclusion can help immediately while you get support."];
    $("#sc-result").innerHTML = '<div class="result-box"><span class="badge ' + band[0] + '">Score ' + score + " of " + (Q.length * 3) + "</span><h2 class=\"mt1\">" + band[1] + "</h2><p>" + band[2] + '</p><div class="row"><a class="btn btn-primary" href="' + EC.root + 'responsible-gaming/#help">See helplines &amp; tools</a><button class="btn btn-ghost" type="button" onclick="location.reload()">Start over</button></div><p class="faint mt1 mb0" style="font-size:.85rem">Not a diagnosis. Your answers never left this page.</p></div>';
    $("#sc-result").scrollIntoView({ behavior: "smooth", block: "start" });
  });
})();
