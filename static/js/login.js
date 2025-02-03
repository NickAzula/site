;(function(window, document) {
    var Vector2 = (function() {
    function Vector2(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }
    return Vector2;
    })();
    Vector2.prototype.add = function(addend) {
    this.x += addend.x;
    this.y += addend.y;
    };

    var RainDrop = (function() {
    function RainDrop(parent) {
        this.size = 2;
        this.parent = parent;
        this.init();
    }
    return RainDrop;
    })();

    RainDrop.prototype.init = function() {
    this.life = 0;
    this.ttl = Math.random() * 500 + 300;
    this.position = new Vector2(Math.random() * window.innerWidth, 0);
    this.velocity = new Vector2(0.5 - Math.random() * 1, Math.random() * 1 + 0.2);
    this.terminalVelocity = 8;
    };
    RainDrop.prototype.update = function() {
    if (this.position.x > window.innerWidth || this.position.x < -this.size || this.life > this.ttl) {
        this.init();
    }
    if (this.position.y > this.parent.floor) {
        this.position.y = this.parent.floor - this.size;
        this.velocity.y *= -0.2 - Math.random() * 0.2;
    }
    this.life++;
    this.position.add(this.velocity);
    this.velocity.y += 0.1;
    };

    var Rain = (function() {
    function Rain(args) {
        this.props = args;
        // Изначально дождь выключен
        this.isRaining = false;
        this.rainDrops = [];
        this.init();
    }
    return Rain;
    })();

    Rain.prototype.init = function() {
    this.createCanvas();
    this.resize();
    this.loop();
    };

    // Метод переключения дождя
    Rain.prototype.toggle = function() {
    if (this.isRaining) {
        this.isRaining = false;
        // Удаляем canvas
        if (this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
        }
    } else {
        this.isRaining = true;
        document.body.appendChild(this.canvas);
        this.loop();
    }
    };

    Rain.prototype.resize = function() {
    var attr = 'position: absolute; z-index: 0; top: 0; left: 0; height: 100vh; width: 100vw;';
    this.canvas.setAttribute('style', attr);
    this.dimensions = {
        width: window.innerWidth,
        height: window.innerHeight
    };
    this.canvas.width = this.dimensions.width;
    this.canvas.height = this.dimensions.height;
    this.floor = this.dimensions.height * 0.7;
    };

    Rain.prototype.createCanvas = function() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    document.body.appendChild(this.canvas);
    };

    Rain.prototype.draw = function() {
    // Фон дождя (полностью чёрный)
    this.ctx.fillStyle = this.props.backgroundColor;
    this.ctx.fillRect(0, 0, this.dimensions.width, this.floor);

    // Капли дождя
    for (var i = 0, len = this.rainDrops.length; i < len; i++) {
        var rainDrop = this.rainDrops[i];
        rainDrop.update();
        this.ctx.fillStyle = this.props.rainColor;
        this.ctx.fillRect(rainDrop.position.x, rainDrop.position.y, rainDrop.size, rainDrop.size);
    }

    // Отражение снизу
    this.reflect();
    };

    Rain.prototype.reflect = function() {
    var grad = this.ctx.createLinearGradient(
        this.dimensions.width / 2,
        this.floor * 0.6,
        this.dimensions.width / 2,
        this.floor
    );
    grad.addColorStop(0, 'rgba(20,30,40,1)');
    grad.addColorStop(1, 'rgba(20,30,40,0)');
    this.ctx.save();
    this.ctx.scale(1, -1);
    this.ctx.translate(0, this.floor * -2);
    this.ctx.filter = 'blur(2px) saturate(150%)';
    this.ctx.drawImage(
        this.canvas,
        0,
        0,
        this.dimensions.width,
        this.floor,
        0,
        0,
        this.dimensions.width,
        this.floor
    );
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.dimensions.width, this.floor);
    this.ctx.restore();
    };

    Rain.prototype.loop = function() {
    if (!this.isRaining) return;
    var self = this;
    // Добавляем капли
    if (self.rainDrops.length < self.props.rainDropCount) {
        setTimeout(function() {
        self.rainDrops.push(new RainDrop(self));
        }, Math.random() * 200);
    }

    self.draw();
    self.animationId = window.requestAnimationFrame(self.loop.bind(self));
    };

    window.rainInstance = null;

    window.onload = function() {
    var args = {
        rainDropCount: 500,
        rainColor: 'rgba(150,180,255,0.8)',
        backgroundColor: 'rgba(0,0,0,1)'
    };
    window.rainInstance = new Rain(args);

    window.onresize = function() {
        window.rainInstance.resize();
    };
    };

    window.requestAnimationFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) {
        window.setTimeout(callback, 1000 / 60);
        };
    })();
})(this, document);

const translations = {
    ru: {
    pageTitle: "NickAzula",
    pageSubtitle: "Reinvents finance",
    loginTitle: "Вход",
    usernamePlaceholder: "Логин или почта",
    passwordPlaceholder: "Пароль",
    signInButton: "Войти",
    forgotLink: "Забыли пароль?",
    registerLink: "Регистрация"
    },
    en: {
    pageTitle: "NickAzula",
    pageSubtitle: "Reinvents finance",
    loginTitle: "Login",
    usernamePlaceholder: "Username or Email",
    passwordPlaceholder: "Password",
    signInButton: "Sign In",
    forgotLink: "Forgot password?",
    registerLink: "Sign Up"
    }
};

let currentLang = "ru";

function setLanguage(lang) {
    currentLang = lang;

    const pageTitleElem = document.getElementById("pageTitle");
    const pageSubtitleElem = document.getElementById("pageSubtitle");
    const loginTitleElem = document.getElementById("loginTitle");
    const usernameField = document.getElementById("usernameField");
    const passwordField = document.getElementById("passwordField");
    const signInBtn = document.getElementById("signInBtn");
    const forgotLink = document.getElementById("forgotLink");
    const registerLink = document.getElementById("registerLink");

    pageTitleElem.textContent = translations[lang].pageTitle;
    pageSubtitleElem.textContent = translations[lang].pageSubtitle;
    loginTitleElem.textContent = translations[lang].loginTitle;
    usernameField.placeholder = translations[lang].usernamePlaceholder;
    passwordField.placeholder = translations[lang].passwordPlaceholder;
    signInBtn.textContent = translations[lang].signInButton;
    forgotLink.textContent = translations[lang].forgotLink;
    registerLink.textContent = translations[lang].registerLink;

    // Пример "жирного" текста на русском
    if (lang === "ru") {
    forgotLink.style.fontFamily = "Arial Black, sans-serif";
    forgotLink.style.fontWeight = "bold";

    registerLink.style.fontFamily = "Arial Black, sans-serif";
    registerLink.style.fontWeight = "bold";
    } else {
    forgotLink.style.fontFamily = "";
    forgotLink.style.fontWeight = "";

    registerLink.style.fontFamily = "";
    registerLink.style.fontWeight = "";
    }
}

document.addEventListener("DOMContentLoaded", function() {
    setLanguage(currentLang);

    const langToggleBtn = document.getElementById("langToggle");
    langToggleBtn.addEventListener("click", function() {
    if (currentLang === "ru") {
        setLanguage("en");
        this.textContent = "RU";
    } else {
        setLanguage("ru");
        this.textContent = "ENG";
    }
    });

    const rainToggleBtn = document.getElementById("rainToggle");
    rainToggleBtn.addEventListener("click", function() {
    if (window.rainInstance) {
        window.rainInstance.toggle();
        if (window.rainInstance.isRaining) {
        this.textContent = "Rain OFF";
        } else {
        this.textContent = "Rain ON";
        }
    }
    });

    // Показ/скрытие пароля
    const togglePassIcon = document.getElementById("togglePass");
    togglePassIcon.addEventListener("click", function() {
    const passField = document.getElementById("passwordField");
    if (passField.type === "password") {
        passField.type = "text";
    } else {
        passField.type = "password";
    }
    });
});

document.getElementById("signInBtn").addEventListener("click", async function() {
    const username = document.getElementById("usernameField").value;
    const password = document.getElementById("passwordField").value;

    const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (response.ok) {
        window.location.href = "/home";
    } else {
        alert(data.message);
    }
});
