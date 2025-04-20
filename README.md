# 📵 Facebook Scroll Limiter

Don't want to get stuck scrolling Facebook but also don't want to get locked out of Facebook when you just leave it open and go afk? This is the script for you!

A Tampermonkey script that lets you only scroll a certain amount on Facebook in succession but also notices when you're afk. Works on Facebook main page and also on <code>facebook.com/?sk=h_chr</code>.

## ✨ Features

- ⏱ **Live "Time Wasted" Tracker**  
  Shows how long you've spent scrolling during this session.

- 📊 **Progress Bar Counter**  
  See how many scrolls you've done out of your session limit.

- ⛔ **Automatic Blocking**  
  After scrolling too much, Facebook is blocked for a cooldown period.

- 🔄 **Auto-Unblocks After Cooldown**  
  Timer counts down, then automatically reloads the page to let you back in.

- 🎯 **SPA-Aware**  
  Works with Facebook's single-page app navigation (no page reloads needed).

- 🧠 **Smart Reset**  
  If you're inactive (not scrolling Facebook) for 10 minutes, your count resets.

## 🛠 Installation

1. **Install [Tampermonkey](https://www.tampermonkey.net/)** for your browser.
2. **Click to install the script**:  
   [Install from GitHub (raw)](https://raw.githubusercontent.com/dianx93/facebook-scroll-limiter/main/facebook-scroll-limiter.user.js)  

3. Reload Facebook and start scrolling. The tracker appears automatically.

## ⚙️ Configuration

Edit these constants at the top of the script to customize:

```js
    const SCROLL_LIMIT       = 150;    // Maximum scroll events
    const IDLE_RESET_M      = 10;      // Reset when idle for X minutes
    const BLOCK_DURATION_M  = 15;      // Block duration
