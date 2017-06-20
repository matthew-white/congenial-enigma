(function() {
  // Adding a trailing space for ease of combining with other selectors.
  var TOP_SELECTOR = '#integrations-new ';

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
  var PatternChoice = patternChoiceFactory({
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
    children: [DataSourceServiceChoice, ODKChoices],
    root: true
  });
  var Draft = draftFactory({ firstElement: DataSourceChoices });
  var CongenialEnigma = listenerFactory([
    DataSourceChoices,
    AlertChoices,
    DataDestinationChoices,
    Finalization,
    Draft
  ]);

  CongenialEnigma.listen();


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

  /*
  The integration wizard has multiple "steps," each of which is made up of one
  or more "choices." Users must complete each choice before moving on to the
  next choice and complete each step before moving on to the next step.

  Choices come in different forms, but all choice objects include these methods:

    nextElement()   Returns the element that follows the choice. Once the choice
                    is completed, the element is shown. The element is usually
                    another choice or a choice list.
    hasDraft()      Returns true if there is draft data for the choice and false
                    if not.
    restoreDraft()  If there is draft data for the choice, restoreDraft()
                    restores it, shows the next element, and returns true.
                    Otherwise, it returns false. In many cases, restoreDraft()
                    leaves it to the view to restore/render any draft data and
                    simply shows the next element.
    listen()        Adds listeners for the choice.
  */

  /*
  serviceChoiceFactory() returns an object representing a "service choice,"
  through which the user selects a single service. At the moment, even though a
  service choice may show multiple services, only one service is truly supported
  and will move the wizard forward. Options (all required):

    choiceId     The HTML id of the service choice
    serviceId    The HTML id of the supported service
    nextChoices  The choice list that follows the service choice

  serviceChoiceFactory() returns an object with the standard choice methods:

    nextElement()
    hasDraft()
    restoreDraft()
    listen()
  */
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

  /*
  choicePanelFactory() returns an object representation of a "choice panel," a
  panel through which the user makes a single choice. The panel includes a form
  with one or more fields and has one of the following states:

    1. Hidden. The panel is hidden.
    2. Active. The panel is activated and is ready for the user to make a
       choice.
    3. Complete. The choice has been made.

  There are two types of choice panels:

    1. Default
    2. Radio. A panel with a single radio field.

  Choice panels have the following actions/buttons:

    1. Complete. Submits the form, thereby completing the choice. The panel
       becomes deactivated.
    2. Revisit. Reactivates the panel, hiding the elements that follow the
       choice.
    3. Add. Some panels, for example, radio panels, have an add action to add a
       new option to the selection list.

  choicePanelFactory() accepts the following options:

    id              Required. The HTML id of the choice panel.
    nextElement     Required. The element that follows the choice panel. This
                    may be any object with show() and hide() methods.
    type            The type of choice panel. Only 'radio' is supported.
    hidden          Some choice panels are independently hideable: they have
                    exposed show() and hide() methods. Other panels are nested
                    in choice lists that determine their visibility: the panel
                    is visible if and only if the choice list is visible. If the
                    `hidden` option is falsy, the panel is initialized with a
                    state of 'active' and is not independently hideable: its
                    visibility depends on the choice list in which it is nested.
                    Otherwise, the panel is initialized with a state of 'hidden'
                    and has show() and hide() methods. The `hidden` option has
                    no effect on how the panel is initially rendered: for
                    example, if a panel is not initially hidden, it is the
                    view's responsibility to render the panel as activated.
    beforeActivate  A callback that is invoked before the choice panel is
                    activated. A panel can be activated in two ways:

                      1. The panel is shown via the show() method. (See option
                         `hidden`.)
                      2. The panel is revisited

                    Note that this means that if the panel is not initially
                    hidden, the callback is invoked only when the panel is
                    revisited, not when it is initially rendered.

  choicePanelFactory() returns an object with the following methods:

    Standard choice methods
    -----------------------

    nextElement()
    hasDraft()
    restoreDraft()
    listen()

    Choice panels that are initially hidden
    ---------------------------------------

    show()  Shows the choice panel.
    hide()  Hides the choice panel and the elements that follow it.

    Radio choice panels
    -------------------

    val()  Returns the value of the selected radio button.

    Other methods
    -------------

    state()     Returns the state of the choice panel.
  */
  function choicePanelFactory(options) {
    var $panel, state;
    var choice = {
      nextElement: nextElement,
      state: function() { return state; },
      hasDraft: hasDraft,
      restoreDraft: restoreDraft,
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

    function hasDraft() {
      return $panel.data('hasDraft');
    }

    function restoreDraft() {
      var draft = hasDraft();
      if (draft)
        complete(true);
      return draft;
    }

    function toggleMutedText(state) {
      $panel.toggleClass('text-muted', state);
      $panel.find('.panel-title span').toggleClass('text-muted', state);
    }

    function activateControls() {
      var radioSelection = {};
      var $enabled = $panel.find('input, select, textarea').filter(function() {
        var visible, $control = $(this);
        var permanentlyDisabled = $control.hasClass('permanently-disabled');
        var tagName = $control.prop('tagName').toLowerCase();
        var type = tagName === 'input' ? $control.attr('type') : tagName;
        if (type === 'radio') {
          var $radio = $control.closest('.radio');
          visible = !$radio.hasClass('filtered');
          $radio.toggle(visible);

          if (visible && !permanentlyDisabled) {
            $radio.removeClass('disabled');
            var name = $control.attr('name');
            if (!radioSelection[name] || $control.prop('checked'))
              radioSelection[name] = $control.attr('id');
          }
        }
        else {
          visible = true;
          if (type === 'checkbox' && !permanentlyDisabled)
            $control.closest('.checkbox').removeClass('disabled');
        }
        if (visible && !permanentlyDisabled)
          $control.prop('disabled', false);
        return visible && !permanentlyDisabled;
      });

      for (var name in radioSelection) {
        if (radioSelection.hasOwnProperty(name))
          $('#' + radioSelection[name]).prop('checked', true);
      }

      return $enabled;
    }

    function activateActions($enabledControls) {
      $panel.find('.action-add').show();
      $panel.find('.action-complete').toggle($enabledControls.length > 0);
      $panel.find('.action-revisit').hide();
    }

    /*
    Activates the panel by making the following changes:

      1. Invokes the beforeActivate callback
      2. Activates the step title under which the panel is nested
      3. Unmutes text, including the title
      4. Shows radio buttons except those with a `filtered` class
      5. Enables fields except those with a permanently-disabled class
      6. Selects the first visible, enabled radio button if one is not selected
         already
      7. Hides the revisit action, shows the add action, and shows the complete
         action if appropriate
    */
    function activate() {
      if (state === 'active')
        return;
      if (options.beforeActivate)
        options.beforeActivate($panel);
      activateStepTitle($panel);
      toggleMutedText(false);
      var $enabledControls = activateControls();
      activateActions($enabledControls);
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

    // Returns the fields to save to the draft.
    function draftFields() {
      return $panel.find('input, select, textarea').filter(function() {
        var $field = $(this), tagName = $field.prop('tagName').toLowerCase();
        var type = tagName === 'input' ? $field.attr('type') : tagName;
        if (type === 'hidden') {
          // Always include hidden fields unless they are associated with a
          // hidden or checked checkbox.
          var selector = 'input[type="checkbox"]' +
            '[id="' + $field.attr('id') + '"]';
          var $checkbox = $panel.find(selector);
          return $checkbox.length === 0 ||
            ($checkbox.is(':visible') && !$checkbox.prop('checked'));
        }
        if ((type === 'radio' || type === 'checkbox') &&
          !$field.prop('checked'))
          return false;
        return $field.is(':visible');
      });
    }

    function saveDraft() {
      var data = {};
      draftFields().each(function() {
        var $el = $(this);
        var name = $el.data('draftName') || $el.attr('name');
        data[name] = $el.val();
      });
      $.post('/integrations/save_draft', data);
    }

    /*
    Updates the panel's UI after it has been completed:

      1. Mutes text, including the title
      2. Disables fields
      3. Hides unchecked radio buttons
      4. Hides the add and complete actions and shows the revisit action
    */
    function updateUIAfterComplete() {
      toggleMutedText(true);
      $panel.find('input[type="radio"]:not(:checked)').closest('.radio').hide();
      $panel.find('input, select, textarea').prop('disabled', true);
      $panel.find(':checked').closest('.checkbox, .radio').addClass('disabled');
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

  /*
  filteredChoicePanelFactory() returns a radio choice panel that is initially
  hidden. The panel's selection list depends on a previous choice of configured
  service: the list is filtered according to the configured service. Options
  (all required):

    id                   Passed to choicePanelFactory().
    nextElement          Passed to choicePanelFactory().
    configuredServiceId  Callback that returns the record ID of the selected
                         configured service
  */
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

  function patternChoiceFactory(options) {
    var choice = choicePanelFactory(options);
    var listen = choice.listen;
    var $ruleClassName, $dynamicFields;
    return $.extend(choice, {
      listen: function() {
        listen();
        $(document)
          .on('turbolinks:load', function() {
            $ruleClassName = $('#rule_class_name');
            $dynamicFields = dynamicFields();
            toggleDynamicFields(true);
          })
          .on('change', '#rule_class_name', function() {
            toggleDynamicFields(false);
            $dynamicFields = dynamicFields();
            toggleDynamicFields(true);
          });
      },
      dynamicFields: function() {
        return $dynamicFields;
      }
    });

    // Supports number, text, checkbox, and hidden inputs.
    function dynamicFields() {
      var data = $ruleClassName.find('option:checked').data('fields');
      var selector;
      if (!data)
        selector = '';
      else {
        var selectors = data.split(/\s+/).map(function(id) {
          // Using the [id=some_id] selector rather than #some_id, because
          // checkbox fields may have associated hidden fields with the same id.
          return '[id="' + id + '"]';
        });
        selector = selectors.join(',');
      }
      return $(selector);
    }

    function toggleDynamicFields(state) {
      $dynamicFields.closest('.form-group, .checkbox').toggle(state);
      $dynamicFields.filter('[data-required]').prop('required', state);
    }
  }


  /* ------------------------------------------------------------------------ */
       /* Other component factories */
  /* ------------------------------------------------------------------------ */

  /*
  choiceListFactory() returns a "choice list," which groups together one or more
  other choices and/or choice lists. Think of a choice list as a tree, where
  choice lists are branches and choices are leaves. Like a choice panel, a
  choice list has one of the following states:

    1. Hidden
    2. Active
    3. Complete

  choiceListFactory() accepts the following options:

    id        Required. HTML id of the choice list.
    children  Required. Array of the choices and choice lists contained in the
              list (immediate children only).
    root      Most choice lists are hideable: they have exposed show() and
              hide() methods. However, the root/topmost choice list is always
              visible. If the `root` option is truthy, the choice list is
              initialized with a state of 'active' and is not hideable.
              Otherwise, the choice list is initialized with a state of 'hidden'
              and has show() and hide() methods. The `root` option has no effect
              on how the choice list is initially rendered: it is the view's
              responsibility to render the choice list according to its initial
              visibility.

  choiceListFactory() returns an object with the following methods:

    Standard choice methods
    -----------------------

    nextElement()   Returns the element that follows the choice list. Once the
                    choice list is completed, the element is shown. The element
                    is usually a choice or choice list.
    hasDraft()      Returns true if there is draft data for the first choice of
                    the choice list and false if not.
    restoreDraft()  restoreDraft() restores draft data for the elements of the
                    choice list until either it restores them all (returning
                    true) or it encounters an element without draft data
                    (returning false).
    listen()        Adds listeners for the choice list.

    Other properties
    ----------------

    children  The immediate children of the choice list
    state()   Returns the state of the choice list.

    Choice lists that are hideable (not root)
    -----------------------------------------

    show()  Shows the choice list.
    hide()  Hides the choice list and the elements that follow it.
  */
  function choiceListFactory(options) {
    var $choices, hidden;
    var lastChild = options.children[options.children.length - 1];
    var list = {
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
      listen: function() {
        $(document).on('turbolinks:load', function() {
          $choices = $('#' + options.id);
          hidden = !options.root;
        });
        options.children.forEach(function(child) {
          child.listen();
        });
      }
    };
    if (!options.root) {
      $.extend(list, {
        show: function() {
          if (!hidden)
            return;
          $choices.show();
          hidden = false;
          if (this.state() === 'complete')
            this.nextElement().show();
          else
            activateStepTitle($choices);
        },
        hide: function() {
          if (hidden)
            return;
          this.nextElement().hide();
          $choices.hide();
          hidden = true;
        }
      });
    }
    return list;
  }

  function finalizationFactory(id) {
    var $finalization, ruleDataFields;
    return {
      show: show,
      hide: hide,
      listen: listen
    };

    function updatePushUrl() {
      var $pushUrl = $('#push-url');
      var url = $pushUrl
                  .data('url')
                  .replace('/0', '/' + ServerChoice.val())
                  .replace('/1', '/' + FormChoice.val());
      $pushUrl.text(url);
    }

    function copyRuleFields() {
      $('#rule_type').val($('#rule_class_name').val());

      $('#rule_data_field_name').val($('#rule_field_name').val());
      ruleDataFields = ['rule_data_field_name'];

      PatternChoice.dynamicFields().each(function() {
        var $field = $(this);
        if ($field.attr('type') === 'checkbox' && !$field.prop('checked'))
          return;
        var name = $field.data('ruleDataName');
        if (!name)
          name = $field.attr('name').replace('rule_', '');
        var finalizationId = 'rule_data_' + name;
        $('#' + finalizationId).val($field.val());
        ruleDataFields.push(finalizationId);
      });
    }

    function copyFields() {
      $('#data_source_id').val(FormChoice.val());
      copyRuleFields();
      $('#message').val($('#alert_message').val());
      $('#data_destination_id').val(RecipientListChoice.val());
    }

    function show() {
      updatePushUrl();
      copyFields();
      activateStepTitle($finalization);
      $finalization.show();
    }

    function hide() {
      $finalization.hide();
    }

    // Removes non-applicable rule data fields.
    function removeRuleDataFields() {
      $finalization.find('input').each(function() {
        var $field = $(this), id = $field.attr('id');
        if (id && id.startsWith('rule_data_') && !ruleDataFields.includes(id))
          $field.remove();
      });
    }

    function listen() {
      $(document)
        .on('turbolinks:load', function() {
          $finalization = $('#' + id);
        })
        .on('submit', '#' + id, removeRuleDataFields);
    }
  }

  // Returns an object that listens for a page load, then restores the draft.
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
