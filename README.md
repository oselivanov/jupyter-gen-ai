# Jupyter Notebook 5 GenAI integration plugin

This thing uses local web server comes with llama-cpp-python to answer question and generate code right inside of the Jupyter Notebook, making new cells.

# Installation

pip3 install jupyter-gen-ai
jupyter nbextension install --python --user jupyter_gen_ai
jupyter nbextension enable jupyter_gen_ai/static/main --user

# Examples

python3 -m llama_cpp.server --n_gpu_layers 0 --n_threads 4 --model models/mistral-7b-instruct-v0.1.Q4_K_M.gguf

Use cmd+enter takes current cell content to GenAI, creates a new cell of the same type below and live feeds the response to this new cell.

# TODO

1. Remove hard-coded url
2. Unhardcode model and parameters
2. Pass notebook contents in a context
3. From a list of urls, fetch them and add it to the context
4. Port it to something newer
