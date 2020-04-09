/**
 * Matching module.
 *
 * @package mod_wordcards
 * @author  Justin Hunt - poodll.com
 * * (based on Paul Raine's APPs 4 EFL)
 */

define([
  'jquery',
  'core/ajax',
  'core/log',
  'mod_wordcards/a4e',
  'core/templates'
], function($, Ajax, log, a4e, templates) {

  var app = {
    dryRun: false,
    init: function(props) {

      //pick up opts from html
      var theid = '#' + props.widgetid;
      this.dryRun = props.dryRun;
      this.nexturl = props.nexturl;
      var configcontrol = $(theid).get(0);
      if (configcontrol) {
        var matchingdata = JSON.parse(configcontrol.value);
        $(theid).remove();
      } else {
        //if there is no config we might as well give up
        log.debug('No config found on page. Giving up.');
        return;
      }

      app.process(matchingdata);

      a4e.register_events();

      this.register_events();
    },

    register_events: function() {

      $("#next-button").on("click", function() {
        app.next();
      });

      $('body').on('click', "#close-results", function() {

        var total_time = a4e.calc_total_time(app.results);
        var url = app.nexturl.replace(/&amp;/g, '&') + "&localscattertime=" + total_time
        window.location.replace(url);

      });

      $('body').on('click', "#try-again", function() {
        location.reload();
      });

      $("body").on('click', '.a4e-distractor', function(e) {
        app.check($(this).data('correct'), this);
      });

      $('body').on('click', '#start-button', function() {
        app.start();
      });

      $('body').on('click', '#quit-button', function() {
        app.quit();
      });
    },

    process: function(json) {

      app.terms = json.terms;
      app.has_images = json.has_images;
      a4e.list_vocab("#vocab-list-inner", app.terms);

    },
    start: function() {
      app.results = [];
      a4e.shuffle(app.terms);
      app.pointer = 0;
      $("#vocab-list, #start-button").hide();
      $("#gameboard, #quit-button").show();
      $("#time-counter").text("00:00");
      app.timer = {
        interval: setInterval(function() {
          app.timer.update();
        }, 1000),
        count: 0,
        update: function() {
          app.timer.count++;
          $("#time-counter").text(a4e.pretty_print_secs(app.timer.count));
        }
      }
      app.next();
    },
    quit: function() {
      clearInterval(app.timer.interval);
      $("#gameboard, #quit-button").hide();
      $("#vocab-list, #start-button").show();
    },

    end: function() {
      clearInterval(app.timer.interval);
      $("#gameboard, #quit-button, #start-button").hide();
      $("#results").show();

      //template data
      var tdata = [];
      tdata['results'] = app.results;
      tdata['total'] = app.terms.length;
      tdata['totalcorrect'] = a4e.calc_total_points(app.results);
      var total_time = a4e.calc_total_time(app.results);
      if (total_time == 0) {
        tdata['prettytime'] = '00:00';
      } else {
        tdata['prettytime'] = a4e.pretty_print_secs(total_time);
      }
      templates.render('mod_wordcards/feedback', tdata).then(
        function(html, js) {
          $("#results-inner").html(html);
        }
      );

      var data = {
        results: app.results,
        activity: "match_select"
      };

      console.log(data);

    },
    next: function() {

      $("#next-button").hide();

      a4e.progress_dots(app.results, app.terms);

      if (app.terms[app.pointer]['definition'] !== "" && app.terms[app.pointer]['term'] != "") {
        if (app.terms[app.pointer].image !== null && app.terms[app.pointer].image != "") {
          $("#question").html("<img style='height:200px;width:auto;' class='center-block img-responsive img-thumbnail' src='" + app.terms[app.pointer].image + "'><br/>");
        } else if (app.has_images && (app.terms[app.pointer].image == null || app.terms[app.pointer].image == "")) {
          $("#question").html("<img style='height:200px;width:auto;' class='center-block img-responsive img-thumbnail' src='/images/no-image.png'><br/>");
        }
        $("#question").append("<strong>" + app.terms[app.pointer]['definition'] + "</strong>");
      } else if (app.terms[app.pointer].image !== null && app.terms[app.pointer].image != "") {
        $("#question").html("<img class='center-block img-responsive img-thumbnail' src='" + app.terms[app.pointer].image + "'>");
      } else {
        a4e.alert("Could not generate a test with these settings!", "error");
        app.end();
      }

      $("#input").html(app.get_distractors());

    },

    check: function(correct, clicked) {
      var points = 0;
      if (correct == true) {
        //createjs.Sound.play('correct');
        points = 1;
      } else {
        //createjs.Sound.play('incorrect');
      }
      $(".a4e-distractor").css('pointer-events', 'none');
      var result = {
        question: app.terms[app.pointer]['definition'],
        selected: $(clicked).text(),
        correct: app.terms[app.pointer]['term'],
        points: points,
        time: app.timer.count
      };
      app.timer.count = 0;
      app.results.push(result);

      var background = correct == true ? 'a4e-correct' : 'a4e-incorrect';
      $(clicked).addClass(background).append("<i style='color:" + (correct ? 'green' : 'red') + ";margin-left:5px;' class='fa fa-" + (correct ? 'check' : 'times') + "'></i>").parent().addClass('a4e-click-disabled');

      if (!correct) {
        $(".a4e-distractor[data-correct='true']").addClass('a4e-correct').append("<i style='color:green;margin-left:5px;' class='fa fa-check'></i>");
      }

      //post results to server
      if (correct) {
        this.reportSuccess(app.terms[app.pointer]['id']);
      } else {
        this.reportFailure(app.terms[app.pointer]['id'], $(clicked).data('id'));
      }

      app.pointer++;
      if (!correct) {
        setTimeout(function() {
          if (app.pointer < app.terms.length) {
            $("#next-button").trigger('click');
          } else {
            app.end();
          }
        }, 1500)
      } else {
        setTimeout(function() {
          if (app.pointer < app.terms.length) {
            $("#next-button").trigger('click');
          } else {
            app.end();
          }
        }, 1000)
      }
    },

    get_distractors: function() {
      var distractors = app.terms.slice(0);
      var answer = app.terms[app.pointer]['term'];
      distractors.splice(app.pointer, 1);
      a4e.shuffle(distractors);
      distractors = distractors.slice(0, 4);
      distractors.push(app.terms[app.pointer]);
      a4e.shuffle(distractors);
      var options = [];
      $.each(distractors, function(i, o) {
        var is_correct = o['term'] == answer;
        var term_id = o['id'];
        options.push('<li data-id="' + term_id + '" data-correct="' + is_correct.toString() + '" class="list-group-item a4e-distractor a4e-noselect">' + o['term'] + '</li>');
      });
      var code = '<ul class="list-group a4e-distractors">' + options.join('') + '</ul>';
      return code;
    },

    reportFailure: function(term1id, term2id) {
      if (this.dryRun) {
        return;
      }

      Ajax.call([{
        methodname: 'mod_wordcards_report_failed_association',
        args: {
          term1id: term1id,
          term2id: term2id
        }
      }]);
    },

    reportSuccess: function(termid) {
      if (this.dryRun) {
        return;
      }

      Ajax.call([{
        methodname: 'mod_wordcards_report_successful_association',
        args: {
          termid: termid
        }
      }]);
    }
  };

  return app;

});