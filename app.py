from flask import Flask, render_template, request, jsonify, session
from flask_session import Session
import openai
import os

app = Flask(__name__)

app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

openai.api_key = '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'
app.secret_key = 'supersecretkey'


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json['message']
    current_letter = request.json['currentLetter']

    if 'conversation' not in session:
        session['conversation'] = []
        system_message = "We are going to learn sign language. Guide the user through the alphabet, starting with A. Be encouraging and provide tips for forming each letter."
    else:
        system_message = f"The user has correctly signed the letter {current_letter}. Praise them and introduce the next letter, explaining how to form it in ASL."

    session['conversation'].append({"role": "user", "content": user_message})

    messages = [{
        "role": "system",
        "content": system_message
    }] + session['conversation']

    try:
        response = openai.chat.completions.create(model="gpt-3.5-turbo-1106",
                                                  messages=messages)
        gpt_response = response.choices[0].message.content
        session['conversation'].append({
            "role": "assistant",
            "content": gpt_response
        })
        return jsonify({'response': gpt_response})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8080)
