# Older Jupyter Notebook 5 local GenAI integration plugin

Uses local Ollama, supports Jupyter markdown cell image attachments passing to multimodal LLMs.

# Installation

    pip3 install jupyter-gen-ai
    jupyter nbextension install --python --user jupyter_gen_ai
    jupyter nbextension enable jupyter_gen_ai/static/main --user

# Run local model

    ollama run x/llama3.2-vision:latest

By default cmd+enter takes current cell content to GenAI, creates a new cell of the same type below
and live feeds the response to this new cell.

# TODO

1. Remove hard-coded url
2. Unhardcode model and parameters
2. Pass notebook contents in a context
3. From a list of urls, fetch them and add it to the context
4. Port it to something newer
