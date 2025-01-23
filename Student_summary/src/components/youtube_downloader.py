from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time
import requests
import openai
import os

# API Keys
HF_API_TOKEN = "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"
OPENAI_API_KEY = "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"
WHISPER_MODEL = "openai/whisper-large-v3"

# הגדרת OpenAI
openai.api_key = OPENAI_API_KEY

def transcribe_audio(file_path, retries=3, delay=5000):
    """תמלול קובץ אודיו באמצעות Whisper"""
    try:
        with open(file_path, 'rb') as audio_file:
            audio_data = audio_file.read()

        for i in range(retries):
            try:
                response = requests.post(
                    f"https://api-inference.huggingface.co/models/{WHISPER_MODEL}",
                    data=audio_data,
                    headers={"Authorization": f"Bearer {HF_API_TOKEN}"}
                )
                return response.json()["text"]
            except Exception as e:
                if i < retries - 1:
                    print(f"ניסיון {i+1} נכשל. מנסה שוב בעוד {delay/1000} שניות...")
                    time.sleep(delay/1000)
                else:
                    raise Exception(f"נכשל לתמלל לאחר {retries} ניסיונות")
    except Exception as e:
        print(f"שגיאה בתמלול: {str(e)}")
        raise e

def summarize_text(text):
    """סיכום טקסט באמצעות OpenAI"""
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=[
                {"role": "user", "content": f"סכם את הטקסט הבא בעברית עם נקודות:\n\n{text}"}
            ],
            max_tokens=500,
            temperature=0.5
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"שגיאה בסיכום: {str(e)}")
        raise e

def process_and_summarize(file_path):
    """תהליך מלא של תמלול וסיכום"""
    try:
        # שלב 1: תמלול
        print("מתמלל את הקובץ...")
        transcription = transcribe_audio(file_path)

        # שלב 2: חלוקה לחלקים
        words = transcription.split()
        chunk_size = 1500
        chunks = [' '.join(words[i:i+chunk_size]) for i in range(0, len(words), chunk_size)]

        # שלב 3: סיכום כל חלק
        summaries = []
        for i, chunk in enumerate(chunks):
            print(f"מסכם חלק {i+1}/{len(chunks)}...")
            summary = summarize_text(chunk)
            summaries.append(summary)

        # שלב 4: סיכום סופי
        final_summary = summarize_text(' '.join(summaries))
        print("\nהסיכום הסופי:")
        print(final_summary)
        return final_summary

    except Exception as e:
        print(f"שגיאה בתהליך: {str(e)}")
        raise e

# הקוד המקורי של הורדת YouTube
chrome_options = webdriver.ChromeOptions()
chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])
chrome_options.add_argument('--ignore-certificate-errors')
chrome_options.add_argument('--ignore-ssl-errors')

driver = webdriver.Chrome(
    service=Service(ChromeDriverManager().install()),
    options=chrome_options
)

youtube_urls = [
    "https://www.youtube.com/watch?v=SBnHTvq_ERs"
]

audio_downloader = 'https://y2mate.nu/en-N5yg/'

try:
    driver.get(audio_downloader)
    time.sleep(2)

    for url in youtube_urls:
        try:
            input_field = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, 'video'))
            )
            input_field.clear()
            input_field.send_keys(url)

            submit_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[@type='submit']"))
            )
            submit_button.click()

            download_btn = WebDriverWait(driver, 20).until(
                EC.element_to_be_clickable((By.XPATH, "html/body/form/div[2]/button[1]"))
            )
            download_btn.click()
            
            time.sleep(3)

            # לאחר ההורדה, נעבד את הקובץ
            # שים לב שצריך להתאים את הנתיב לקובץ שהורד
            downloaded_file = "path/to/downloaded/audio1234.mp3"  # עדכן את הנתיב
            if os.path.exists(downloaded_file):
                print(f"מעבד את הקובץ: {downloaded_file}")
                summary = process_and_summarize(downloaded_file)
                print(f"סיכום הקובץ: {summary}")

        except Exception as e:
            print(f"שגיאה בהורדת {url}: {str(e)}")
            continue

except Exception as e:
    print(f"שגיאה כללית: {str(e)}")

finally:
    try:
        driver.quit()
    except:
        pass

print("התהליך הסתיים")



