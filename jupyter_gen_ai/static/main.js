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
    api_server_url: 'http://localhost:11434/v1/chat/completions',
    llm_model: 'x/llama3.2-vision:latest',
  };
  var JLSettings = {};

  var last_prompt = '';

  // Jupyter notebook integration.

  var JLGenerate = function() {
    var cells = Jupyter.notebook.get_cells();
    var indices = Jupyter.notebook.get_selected_cells_indices();
    var selectedIndex = Jupyter.notebook.get_selected_index();
    var cellType = cells[indices[indices.length - 1]].cell_type;

    // Get context from selected cells
    var {context, inline} = getContextFromSelectedCells(cells, indices);
    //console.log(inline, context);

    // Get user prompt
    var prompt = getUserPrompt();
    var content = prompt + '\n\n' + context;

    // Prepare request
    var request = prepareRequest(content);

    // Handle image attachments if present
    if (context.indexOf('](attachment:') !== -1) {
      addImageToRequest(request, cells[indices[0]]);
    }

    // Setup code mirror
    var cm = setupCodeMirror(cells, inline, cellType, selectedIndex);

    // Make API request
    makeStreamingRequest(request, cm);
  }

  function getContextFromSelectedCells(cells, indices) {
    if (indices.length == 1 && cells[indices[0]].code_mirror.getValue().trim() == '') {
      return {context: '', inline: true};
    }

    var context = '';
    for (var i in indices) {
      var cell = cells[indices[i]];
      cell.unrender();
      context += cell.code_mirror.getValue().trim() + '\n\n';
    }
    return {
      context: context.trim(),
      inline: false
    };
  }

  function getUserPrompt() {
    var prompt = window.prompt('What to do?', last_prompt);
    last_prompt = prompt;
    return prompt;
  }

  function prepareRequest(content) {
    return {
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
      "model": JLSettings.llm_model,
      "temperature": 0.7,
      "repeat_penalty": 1.1,
      "stream": true,
      "n": -1,
      "max_tokens": 1000
    };
  }

  function addImageToRequest(request, cell) {
    var name_imdata = Object.entries(cell.attachments)[0];
    var imtype_content = Object.entries(name_imdata[1])[0];
    request['messages'][1]['content'].push({
      "type": "image_url",
      "image_url": {
        "url": 'data:' + imtype_content[0] + ';base64,' + imtype_content[1]
      },
    });
    //console.log(request);
  }

  function setupCodeMirror(cells, inline, cellType, selectedIndex) {
    var cell, cm;
    if (inline) {
      cell = cells[selectedIndex];
      cm = cell.code_mirror;
    } else {
      cell = Jupyter.notebook.insert_cell_below(cellType, selectedIndex);
      cell.unrender();
      cm = cell.code_mirror;
      cm.setValue('');
    }
    return cm;
  }

  function makeStreamingRequest(request, cm) {
    var last_response_len = false;
    $.ajax({
      url: JLSettings.api_server_url,
      contentType: 'application/json',
      data: JSON.stringify(request),
      dataType: 'json',
      processData: false,
      type: 'POST',
      xhrFields: {
        onprogress: function(e) {
          handleStreamingResponse(e, last_response_len, cm);
          last_response_len = e.currentTarget.response.length;
        }
      }
    });
  }

  function handleStreamingResponse(e, last_response_len, cm) {
    var this_response, response = e.currentTarget.response;
    if(last_response_len === false) {
      this_response = response;
    } else {
      this_response = response.substring(last_response_len);
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

        if (JLSettings.bind_generate_to_cmd_enter) {
          Jupyter.keyboard_manager.command_shortcuts.add_shortcuts({
            'cmd-enter': 'jupyter-notebook:generate-answer-to-next-cell',
          });
        }
      });
  }

  return {
		load_ipython_extension : load_ipython_extension,
		load_jupyter_extension : load_ipython_extension,
  };
});
