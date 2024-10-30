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

  var last_prompt = '';

  // Jupyter notebook integration.

  var JLGenerate = function() {
    var cells = Jupyter.notebook.get_cells();
    var indices = Jupyter.notebook.get_selected_cells_indices();

    var cell_type = cells[indices[indices.length - 1]].cell_type;
    var inline;

    if (indices.length == 1 && cells[indices[0]].code_mirror.getValue().trim() == '') {
      context = '';
      inline = true;
    } else {
      context = '';
      for (var i in indices) {
        var index = indices[i];
        var cell = cells[index];
        cell.unrender();
        context += cells[index].code_mirror.getValue().trim() + '\n\n';
      }
      context = context.trim();
      inline = false;
    }
    console.log(inline, context)

    var p = prompt('What to do?', last_prompt);
    last_prompt = p;
    var content = p + '\n\n' + context;


    /*var index = Jupyter.notebook.get_selected_index();
    var this_cell = cells[index];
    this_cell.unrender();
    var this_cm = this_cell.code_mirror;
    var text = this_cm.getValue();*/

    /*
    var last_cells_to_insert = 0;
    var match = /(?:last|previous) ([0-9a-z]+)? ?cells?/g.exec(text);
    if (match) {
      var prev_text = '';
      var last_cells_to_insert = parseInt(match[1]) || 1;

      for (var i = last_cells_to_insert; i >= 1; --i) {
        var previous_cell = Jupyter.notebook.get_cell(index - i);
        previous_cell.unrender();
        prev_text += '\nCell ' + (last_cells_to_insert - i + 1) + ':\n' + previous_cell.code_mirror.getValue() + '\n\n';
      }
      text += '\n' + prev_text;
    }
    */

    var request = {
      "messages": [
        {
          "role": "system",
          "content": "You are a helpful assistant. Be short."
        },
        {
          "role": "user",
          "content": [{"type": "text", "text": content}]
        }
      ],
      "model": "x/llama3.2-vision:latest",
      "temperature": 0.7,
      "repeat_penalty": 1.1,
      "stream": true,
      "n": -1,
      "max_tokens": 1000
    };

    if (context.indexOf('](attachment:') !== -1) {
      var content = [];
      var this_cell = cells[indices[0]];
      var name_imdata = Object.entries(this_cell.attachments)[0];
      var imtype_content = Object.entries(name_imdata[1])[0];
      request['messages'][1]['content'].push({
        "type": "image_url",
        "image_url": {
            "url": 'data:' + imtype_content[0] + ';base64,' + imtype_content[1]
        },
      });
      console.log(request);
    }



    var cm;
    if (inline) {
      var cell = cells[Jupyter.notebook.get_selected_index()];
      var cm = cell.code_mirror;
    } else {
      var cell = Jupyter.notebook.insert_cell_below(
        cell_type, Jupyter.notebook.get_selected_index());
      cell.unrender();
      var cm = cell.code_mirror;
      cm.setValue('');
    }

    var last_response_len = false;
    $.ajax({
      url: "http://localhost:11434/v1/chat/completions",
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

          var lines = this_response.split('\n');
          for (var i in lines) {
            var line = lines[i];
            if (!line.startsWith('data: ')) continue;

            var out = line.slice(6);
            if(out.trim() == '[DONE]') return;

            var d = JSON.parse(out);
            var token = d.choices[0].delta.content;
            if (!token) continue;

            if (cm.getValue() == '') {
              cm.setValue(token.trimStart());
            } else {
              cm.replaceRange(token, {line: Infinity});
            }
          }
        }
    }
    });
  }

  var getAbsoluteUrl = (function() {
    var a;

    return function(url) {
      if(!a) a = document.createElement('a');
      a.href = url;

      return a.href;
    };
  })();


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
