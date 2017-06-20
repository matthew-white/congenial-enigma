(function() {
  // Adding a trailing space for ease of combining with other selectors.
  var TOP_SELECTOR = '#new-integration ';

  var Finalization = finalizationFactory('finalize-integration');
  var RecipientListChoice = filteredChoicePanelFactory({
    id: 'choice-recipient-list',
    configuredServiceId: function() {
      return GmailAccountChoice.val();
    },
    nextElement: Finalization
  });
  var GmailAccountChoice = choicePanelFactory({
    id: 'choice-gmail-account',
    type: 'radio',
    nextElement: RecipientListChoice
  });
  var GmailChoices = choiceListFactory({
    id: 'choices-gmail',
    children: [GmailAccountChoice, RecipientListChoice]
  });
  var DataDestinationServiceChoice = serviceChoiceFactory({
    choiceId: 'choice-data-destination-service',
    serviceId: 'service-gmail',
    nextChoices: GmailChoices
  });
  var DataDestinationChoices = choiceListFactory({
    id: 'choices-data-destination',
    children: [DataDestinationServiceChoice, GmailChoices]
  });
  var MessageChoice = choicePanelFactory({
    id: 'choice-message',
    nextElement: DataDestinationChoices,
    hidden: true
  });
  var PatternChoice = choicePanelFactory({
    id: 'choice-pattern',
    nextElement: MessageChoice
  });
  var AlertChoices = choiceListFactory({
    id: 'choices-alert',
    children: [PatternChoice, MessageChoice]
  });
  var FormChoice = filteredChoicePanelFactory({
    id: 'choice-form',
    configuredServiceId: function() {
      return ServerChoice.val();
    },
    nextElement: AlertChoices
  });
  var ServerChoice = choicePanelFactory({
    id: 'choice-server',
    type: 'radio',
    nextElement: FormChoice
  });
  var ODKChoices = choiceListFactory({
    id: 'choices-odk',
    children: [ServerChoice, FormChoice]
  });
  var DataSourceServiceChoice = serviceChoiceFactory({
    choiceId: 'choice-data-source-service',
    serviceId: 'service-odk',
    nextChoices: ODKChoices
  });
  var DataSourceChoices = choiceListFactory({
    id: 'choices-data-source',
    children: [DataSourceServiceChoice, ODKChoices]
  });
  var Draft = draftFactory({ firstElement: DataSourceChoices });
  var CongenialEnigma = listenerFactory([
    DataSourceChoices,
    AlertChoices,
    DataDestinationChoices,
    Draft
  ]);
  CongenialEnigma.listen();
  return;


  /* ------------------------------------------------------------------------ */
       /* UI helper functions */
  /* ------------------------------------------------------------------------ */

  // Activates a step title (for example, "1 Choose a Data Source") and
  // deactivates the others. $descendant is an element nested under the step.
  function activateStepTitle($descendant) {
    var $h4 = $descendant.closest('tr').find('h4');
    if ($h4.hasClass('text-muted')) {
      $(TOP_SELECTOR + '> tbody > tr h4').addClass('text-muted');
      $h4.removeClass('text-muted');
    }
  }


  /* ------------------------------------------------------------------------ */
       /* Choice factories */
  /* ------------------------------------------------------------------------ */

  // nextChoices must be a choice list.
  function serviceChoiceFactory(options) {
    return {
      nextElement: function() {
        return options.nextChoices;
      },
      hasDraft: function() {
        return options.nextChoices.children[0].hasDraft();
      },
      restoreDraft: function() {
        var draft = this.hasDraft();
        if (draft)
          options.nextChoices.show();
        return draft;
      },
      listen: function() {
        // Adding a trailing space for ease of combining with other selectors.
        var choiceSelector = TOP_SELECTOR + '#' + options.choiceId + ' ';
        var serviceSelector = TOP_SELECTOR + '#' + options.serviceId + ' ';
        var otherServicesSelector = choiceSelector +
          '.service:not(#' + options.serviceId + ') ';
        $(document)
          .on('click', serviceSelector, function(e) {
            e.preventDefault();
            $(otherServicesSelector).fadeTo('slow', 0, function() {
              $(this).remove();
              options.nextChoices.show();
            });
            $(serviceSelector).fadeTo('slow', 1);
          })
          .on('click', otherServicesSelector, function(e) {
            e.preventDefault();
            options.nextChoices.hide();
            activateStepTitle($(choiceSelector));
            var id = '#' + $(this).attr('id');
            $(choiceSelector + '.service:not(' + id + ')').fadeTo('fast', 0.5);
            $(id).fadeTo('fast', 1);
          });
      }
    };
  }

  function choicePanelFactory(options) {
    var $panel, state;
    var choice = {
      nextElement: nextElement,
      state: state,
      hasDraft: hasDraft,
      restoreDraft: restoreDraft,
      complete: complete,
      revisit: revisit,
      listen: listen
    };
    if (options.type === 'radio')
      choice.val = valRadio;
    if (options.hidden) {
      choice.show = show;
      choice.hide = hide;
    }
    return choice;

    function nextElement() {
      return options.nextElement;
    }

    function state() {
      return state;
    }

    function hasDraft() {
      return $panel.data('hasDraft');
    }

    function restoreDraft() {
      var draft = hasDraft();
      if (draft)
        complete(true);
      return draft;
    }

    // Activates select radio buttons:
    //
    //   1. Shows radio buttons except those with a `filtered` class
    //   2. Selects/checks the first visible, enabled radio button
    //
    function activateRadio() {
      $panel.find('.radio.filtered').hide();
      var $visibleRadio = $panel.find('.radio:not(.filtered)');
      var $enabledRadio = $visibleRadio
                             .find('input:not(.permanently-disabled)')
                             .closest('.radio');
      if ($enabledRadio.length > 0) {
        $enabledRadio.removeClass('disabled');
        if ($enabledRadio.find(':checked').length === 0)
          $enabledRadio.find('input').first().prop('checked', true);
        $panel.find('.action-complete').show();
      }
      $visibleRadio.show();
    }

    /*
    Activates the panel by making the following changes:

      1. Invokes the beforeActivate callback
      2. Activates the step title under which the panel is nested
      3. Unmutes text, including the title
      4. Enables inputs except those with a permanently-disabled class
      5. Activates select radio buttons
      6. Hides the revisit action, shows the add action, and shows the complete
         action if appropriate
    */
    function activate() {
      if (state === 'active')
        return;
      if (options.beforeActivate)
        options.beforeActivate($panel);

      activateStepTitle($panel);
      $panel.removeClass('text-muted');
      $panel.find('.panel-title span').removeClass('text-muted');
      var $input = $panel.find('input, select, textarea');
      $input.filter(':not(.permanently-disabled)').prop('disabled', false);
      if ($panel.find('form:not(.form-paragraph)').length > 0)
        activateRadio();
      else
        $panel.find('.action-complete').show();
      $panel.find('.action-add').show();
      $panel.find('.action-revisit').hide();
    }

    function show() {
      if (state !== 'hidden')
        return;
      activate();
      $panel.show();
      state = 'active';
    }

    function hide() {
      if (state === 'hidden')
        return;
      nextElement().hide();
      $panel.hide();
      state = 'hidden';
    }

    function saveDraft() {
      var data = {};
      var selector = 'input[type="radio"]:checked, input[type!="radio"], ' +
        'select, textarea';
      $panel.find(selector).each(function() {
        var $el = $(this);
        var name = $el.data('draftName') || $el.attr('name');
        data[name] = $el.val();
      });
      $.post('/integrations/save_draft', data);
    }

    /*
    Updates the panel's UI after it has been completed:

      1. Mutes text, including the title
      2. Disables inputs
      3. Hides unchecked radio buttons
      4. Hides the add and complete actions and shows the revisit action
    */
    function updateUIAfterComplete() {
      $panel.addClass('text-muted');
      $panel.find('.panel-title span').addClass('text-muted');
      $panel.find('input[type="radio"]:not(:checked)').closest('.radio').hide();
      $panel.find('input, select, textarea').prop('disabled', true);
      $panel.find(':checked').closest('.radio').addClass('disabled');
      $panel.find('.action-add, .action-complete').hide();
      $panel.find('.action-revisit').show();
    }

    function complete(skipDraftSave) {
      if (state !== 'active')
        return;
      if (!skipDraftSave)
        saveDraft();
      updateUIAfterComplete();
      state = 'complete';
      nextElement().show();
    }

    function valRadio() {
      return $panel.find(':checked').val();
    }

    function revisit() {
      if (state !== 'complete')
        return;
      nextElement().hide();
      activate();
      state = 'active';
    }

    function listen() {
      // Adding a trailing space for ease of combining with other selectors.
      var selector = TOP_SELECTOR + '#' + options.id + ' ';
      $(document)
        .on('turbolinks:load', function() {
          $panel = $(selector);
          state = options.hidden ? 'hidden' : 'active';
        })
        .on('submit', selector, function(e) {
          e.preventDefault();
          complete();
        })
        .on('click', selector + '.action-revisit', function(e) {
          e.preventDefault();
          revisit();
        });
    }
  }

  function filteredChoicePanelFactory(options) {
    var filteredOptions = {
      type: 'radio',
      hidden: true,
      beforeActivate: beforeActivate
    };
    var combinedOptions = $.extend({}, options, filteredOptions);
    return choicePanelFactory(combinedOptions);

    function updateAddPath($choice) {
      var $addAction = $choice.find('.action-add');
      var path = $addAction
                   .data('path')
                   .replace('0', options.configuredServiceId());
      $addAction.find('a').prop('href', path);
    }

    function filterRadio($choice) {
      var $radio = $choice.find('.radio');
      $radio.addClass('filtered');
      var selector = '[data-configured-service-id="' +
        options.configuredServiceId() + '"]';
      $radio.filter(selector).removeClass('filtered');
    }

    function beforeActivate($choice) {
      updateAddPath($choice);
      filterRadio($choice);
    }
  }


  /* ------------------------------------------------------------------------ */
       /* Other component factories */
  /* ------------------------------------------------------------------------ */

  /*
  choiceListFactory() returns a "choice list," which groups together one or more
  other choices and/or choice lists. Think of a choice list as a tree, where
  choice lists are branches and choices are leaves. Options:

    id        HTML id of the choice list element
    children  Array of the choices and choice lists contained in the list
              (immediate children only)
  */
  function choiceListFactory(options) {
    var lastChild = options.children[options.children.length - 1];
    var $choices, hidden;
    return {
      children: options.children,
      nextElement: function() {
        return lastChild.nextElement();
      },
      state: function() {
        if (hidden)
          return 'hidden';
        return lastChild.state() === 'complete' ? 'complete' : 'active';
      },
      hasDraft: function() {
        return options.children[0].hasDraft();
      },
      restoreDraft: function() {
        for (var i = 0; i < options.children.length; i++) {
          if (!options.children[i].restoreDraft())
            return false;
        }
        return true;
      },
      show: function() {
        $choices.show();
        hidden = false;
        if (this.state() === 'complete')
          this.nextElement().show();
        else
          activateStepTitle($choices);
        hidden = false;
      },
      hide: function() {
        this.nextElement().hide();
        $choices.hide();
        hidden = true;
      },
      listen: function() {
        $(document).on('turbolinks:load', function() {
          $choices = $('#' + options.id);
          hidden = true;
        });
        options.children.forEach(function(child) {
          child.listen();
        });
      }
    };
  }

  function finalizationFactory(id) {
    var selector = '#' + id;
    return {
      show: show,
      hide: hide
    };

    function updatePushUrl() {
      var $pushUrl = $('#push-url');
      var url = $pushUrl
                  .data('url')
                  .replace('/0', '/' + ServerChoice.val())
                  .replace('/1', '/' + FormChoice.val());
      $pushUrl.text(url);
    }

    function copyFields() {
      $('#data_source_id').val(FormChoice.val());
      $('#rule_data_field_name').val($('#field_name').val());
      $('#rule_type').val($('#rule_class').val());
      $('#rule_data_value').val($('#rule_value').val());
      $('#message').val($('#alert_message').val());
      $('#data_destination_id').val(RecipientListChoice.val());
    }

    function show() {
      updatePushUrl();
      copyFields();
      activateStepTitle($('#choices-data-destination'));
      $(selector).show();
    }

    function hide() {
      $(selector).hide();
    }
  }

  function draftFactory(options) {
    return {
      listen: function() {
        $(document).on('turbolinks:load', function() {
          for (var element = options.firstElement;
               element && element.restoreDraft && element.restoreDraft();
               element = element.nextElement())
            ;
        });
      }
    };
  }

  // Returns an object that listens by calling other listeners.
  function listenerFactory(listeners) {
    return {
      listen: function() {
        listeners.forEach(function(listener) {
          listener.listen();
        });
      }
    };
  }
})();
