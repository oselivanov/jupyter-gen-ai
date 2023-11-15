define([
    'base/js/namespace',
    'notebook/js/notebook',
    'jquery',
], function(
    Jupyter,
    notebook,
    $,
) {
  var JL_DEFAULT_SETTINGS = {
    bind_generate_to_cmd_enter: true,
  };

  var JL_DEFAULT_PARAMS = {
  };

  // Jupyter notebook integration.

  var JLGenerate = function() {
    var cells = Jupyter.notebook.get_cells();

    var index = Jupyter.notebook.get_selected_index();
    var this_cell = cells[index];
    this_cell.unrender();
    var this_cm = this_cell.code_mirror;
    var text = this_cm.getValue();

    var request = {
      "messages": [
        {
          "content": "You are a helpful assistant, " +
                     "if you asked for a code, you give just a code, " +
                     "without explanations.",
          "role": "system"
        },
        {
          "content": text,
          "role": "user"
        }
      ],
      "temperature": 0.7,
      "repeat_penalty": 1.1,
      "stream": true,
      "n": -1
    };

    var next_cell = Jupyter.notebook.insert_cell_below(
      this_cell.cell_type, Jupyter.notebook.get_selected_index());
    next_cell.unrender();
    var next_cm = next_cell.code_mirror;
    next_cm.setValue('');

    var last_response_len = false;
    $.ajax({
      url: "http://localhost:8000/v1/chat/completions",
      contentType: 'application/json',
      data: JSON.stringify(request),
      dataType: 'json',
      processData: false,
      type: 'POST',
      xhrFields: {
        onprogress: function(e) {
          var this_response, response = e.currentTarget.response;
          if(last_response_len === false) {
            this_response = response;
            last_response_len = response.length;
          } else {
            this_response = response.substring(last_response_len);
            last_response_len = response.length;
          }

          if (this_response.startsWith('data: ')) {
            var out = this_response.slice(6);
            if(out.trim() == '[DONE]') return;
            var d = JSON.parse(out);
            if (d.choices[0].delta.content) {
              var text = d.choices[0].delta.content;
              next_cm.setValue(next_cm.getValue() + text);
            }
          }
        }
    }
    });
  }

  function load_ipython_extension() {
		return Jupyter.notebook.config.loaded
			.then(function () {
        var JLSettings = {};

				$.extend(
          true, JLSettings,
          JL_DEFAULT_SETTINGS,
          Jupyter.notebook.config.data.jupyter_gen_ai);

        Jupyter.keyboard_manager.actions.register(
          { help: 'Generate AI answer in the new cell created below',
            icon: 'fa-check',
            handler: JLGenerate },
          'generate-answer-to-next-cell',
          'jupyter-notebook');

        if (JLSettings.bind_answer_to_cmd_enter) {
          Jupyter.keyboard_manager.command_shortcuts.add_shortcuts({
            'cmd-enter': 'jupyter-notebook:-answer-to-next-cell',
          });
        }
      });
  }

  return {
		load_ipython_extension : load_ipython_extension,
		load_jupyter_extension : load_ipython_extension,
  };
});
