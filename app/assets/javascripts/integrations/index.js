$(document).on('click', '#integrations-index tbody tr', function() {
  var $tr = $(this);
  if (!$tr.hasClass('integration-details'))
    $tr.next().toggle();
  else
    $tr.hide();
});
