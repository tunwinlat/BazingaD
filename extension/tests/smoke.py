"""Exercise the installed extension with real browser shortcuts."""

import os
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
from zipfile import ZipFile

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as conditions
from selenium.webdriver.support.ui import WebDriverWait

browser = sys.argv[1]
extension = Path("extension/dist", browser).resolve()
screenshots = Path("extension-test-screenshots")
screenshots.mkdir(exist_ok=True)


def start_browser(directory):
    if browser == "firefox":
        options = webdriver.FirefoxOptions()
        driver = webdriver.Firefox(options=options)
        try:
            package = Path(directory, "bazingad.zip")
            with ZipFile(package, "w") as archive:
                for path in extension.iterdir():
                    archive.write(path, path.name)
            driver.install_addon(str(package), temporary=True)
        except Exception:
            driver.quit()
            raise
        return driver

    options = webdriver.ChromeOptions() if browser == "chrome" else webdriver.EdgeOptions()
    options.add_argument("--no-first-run")
    options.add_argument(f"--load-extension={extension}")
    options.add_experimental_option(
        "prefs", {"homepage_is_newtabpage": True, "browser.show_home_button": True}
    )
    if browser == "chrome":
        options.binary_location = os.environ["CHROME_TEST_BINARY"]
        return webdriver.Chrome(service=Service(), options=options)
    return webdriver.Edge(options=options)


def browser_key(*keys):
    subprocess.run(["xdotool", "key", "--clearmodifiers", *keys], check=True)


def wait_for_title(driver, title):
    WebDriverWait(driver, 15).until(
        conditions.text_to_be_present_in_element((By.ID, "dashboard-title"), title)
    )


with TemporaryDirectory() as directory:
    with start_browser(directory) as driver:
        driver.set_window_rect(0, 0, 1240, 850)
        print(f"{browser}: {driver.capabilities.get('browserVersion')}", flush=True)
        try:
            driver.get("about:blank")
            tabs = set(driver.window_handles)
            browser_key("ctrl+t")
            WebDriverWait(driver, 15).until(lambda current: set(current.window_handles) - tabs)
            new_tab = (set(driver.window_handles) - tabs).pop()
            driver.switch_to.window(new_tab)
            wait_for_title(driver, "BazingaD")
            driver.save_screenshot(str(screenshots / f"{browser}-new-tab.png"))

            driver.find_element(By.LINK_TEXT, "Settings").click()
            title_input = WebDriverWait(driver, 15).until(
                conditions.element_to_be_clickable((By.ID, "dashboard-title"))
            )
            title_input.clear()
            title_input.send_keys("My BazingaD dashboard")
            driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()
            WebDriverWait(driver, 15).until(
                conditions.text_to_be_present_in_element((By.ID, "status"), "Settings saved.")
            )
            driver.save_screenshot(str(screenshots / f"{browser}-settings.png"))

            driver.get("about:blank")
            browser_key("alt+Home")
            wait_for_title(driver, "My BazingaD dashboard")
            driver.save_screenshot(str(screenshots / f"{browser}-home.png"))
            print("New Tab, password-free settings, title persistence, and Home passed.", flush=True)
        except Exception:
            print(f"Last browser URL: {driver.current_url}", flush=True)
            driver.save_screenshot(str(screenshots / f"{browser}-failure.png"))
            raise
