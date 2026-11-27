#!/usr/bin/env python3
"""Genera la versión "lista" (B) de la prueba A/B a partir de las landings originales (A).

    A: /black/index.html y /navidad/index.html  -> piden instalar la app.
    B: /black/guia/index.html y /navidad/guia/index.html -> piden solo el email,
       a cambio del checklist (/checklist/).

Cada versión va en su propio anuncio de Meta. B es la misma página que A salvo la
petición principal: si cambias A, vuelve a correr este script (python3 scripts/ab-lista.py)
para que las dos sigan siendo iguales en todo lo demás.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

EVENTS = {
    "black": {"evento": "Black Friday", "badge": "Checklist gratis para Black Friday"},
    "navidad": {"evento": "Navidad", "badge": None},  # Navidad conserva la cuenta regresiva
}

BTN = "inline-flex items-center justify-center rounded-xl bg-blue-brand px-7 py-3.5 text-base font-medium text-white shadow-soft transition hover:bg-[#00347a]"
INPUT = "w-full min-w-0 flex-1 rounded-xl border border-ink-200 bg-white px-4 py-3.5 text-base text-ink-900 placeholder:text-ink-400 focus:border-blue-brand focus:outline-none focus:ring-4 focus:ring-blue-brand/10 aria-[invalid=true]:border-[#C0392B]"


def subscribe_box(loc: str, box_id: str, title: str, done_extra: str = "") -> str:
    """Formulario de email + aviso de éxito con el enlace al checklist."""
    return f'''<div {box_id}data-subscribe class="w-full scroll-mt-24">
                        {title}
                        <form data-subscribe-form data-loc="{loc}" novalidate class="mt-3 flex w-full flex-col gap-3 sm:flex-row">
                            <label for="sub-{loc}-email" class="sr-only">Tu email</label>
                            <input id="sub-{loc}-email" name="email" type="email" autocomplete="email" inputmode="email" placeholder="tu@email.com" required class="{INPUT}">
                            <div class="hp" aria-hidden="true"><label for="sub-{loc}-website">No completar</label><input id="sub-{loc}-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>
                            <button type="submit" class="{BTN}">Enviarme el checklist</button>
                        </form>
                        <p class="mt-2 text-sm font-semibold text-[#C0392B]" role="alert" data-form-error hidden>Revisa tu email.</p>
                        <div data-subscribe-done hidden tabindex="-1" class="mt-3 rounded-xl bg-mint-brand p-5">
                            <p class="font-semibold text-ink-900">¡Listo! Tu checklist ya está disponible.</p>
                            <p class="mt-1 text-[15px] text-ink-700">También te escribiremos de vez en cuando con consejos para tu tienda. Te das de baja cuando quieras.</p>
                            <a href="/checklist/" data-track="checklist_open" data-loc="{loc}" class="mt-4 {BTN}">Abrir el checklist</a>{done_extra}
                        </div>
                    </div>'''


def sub(pattern: str, repl, text: str, count: int = 1, flags=re.S) -> str:
    new, n = re.subn(pattern, repl, text, count=count, flags=flags)
    if n != count:
        sys.exit(f"ab-lista: no encontré el patrón ({n}/{count}): {pattern[:80]}")
    return new


def build(slug: str) -> str:
    cfg = EVENTS[slug]
    ev = cfg["evento"]
    html = (ROOT / slug / "index.html").read_text()

    html = sub(r'<html lang="es">', '<html lang="es" data-variant="lista">', html)
    # Misma canónica que A (es la misma página) y fuera de los buscadores.
    html = sub(r'(<link rel="canonical"[^>]*>)', r'\1\n    <meta name="robots" content="noindex">', html)

    if cfg["badge"]:
        html = sub(r'(<span class="inline-flex items-center gap-2 rounded-full bg-plum-brand[^"]*">\s*<span[^>]*></span>\s*)[^<]+',
                   r"\g<1>" + cfg["badge"] + "\n                    ", html)

    # Hero: el formulario reemplaza a los botones de instalar y demo.
    hero_title = f'<p class="text-base font-semibold text-ink-900">Checklist gratis: 12 cosas que revisar en tu tienda antes de {ev}.</p>'
    html = sub(r'<div class="order-2 mt-8 flex w-full flex-col gap-3 sm:order-3 sm:w-auto sm:flex-row">.*?</div>',
               '<div class="order-2 mt-8 w-full max-w-xl sm:order-3">\n                    '
               + subscribe_box("hero", 'id="suscribir" ', hero_title) + "\n                    </div>", html)
    html = sub(r'<p class="order-2 mt-4 text-sm text-ink-700 sm:order-4">[^<]*</p>',
               '<p class="order-2 mt-4 text-sm text-ink-700 sm:order-4">Gratis, solo tu email · Sin instalar nada · Soporte en español</p>', html)

    # Sección 6: el formulario largo (demo) pasa a ser el del checklist. Conserva id="contacto"
    # porque la barra de chat del teléfono se esconde sobre ella.
    contacto = f'''<!-- 6. Checklist (versión "lista" de la prueba A/B) -->
        <section id="contacto" class="border-t border-ink-200 bg-ink-50 py-16 sm:py-24" data-hide-sticky>
            <div class="mx-auto grid max-w-6xl items-start gap-10 px-4 sm:px-8 lg:grid-cols-2">
                <div>
                    <p class="text-sm font-semibold uppercase tracking-widest text-blue-brand">Checklist gratis</p>
                    <h2 class="mt-3 text-3xl font-bold text-ink-900 sm:text-4xl">Revisa tu tienda antes de {ev} en 15 minutos.</h2>
                    <p class="mt-4 text-lg leading-relaxed text-ink-700">Doce puntos concretos para que la temporada alta no te pille con productos agotados, descuentos mal puestos o precios bajo costo.</p>
                    <ul class="mt-6 space-y-3">
                        <li class="flex gap-3 text-[15px] text-ink-700"><span class="font-bold text-blue-brand">✓</span>Qué productos revisar primero y cuánto stock dejar de colchón</li>
                        <li class="flex gap-3 text-[15px] text-ink-700"><span class="font-bold text-blue-brand">✓</span>Cómo revisar descuentos y precios antes de activar la promo</li>
                        <li class="flex gap-3 text-[15px] text-ink-700"><span class="font-bold text-blue-brand">✓</span>Qué hacer cuando un producto se agota en plena campaña</li>
                        <li class="flex gap-3 text-[15px] text-ink-700"><span class="font-bold text-blue-brand">✓</span>Hecho para tiendas Shopify en Chile y Latinoamérica</li>
                    </ul>
                </div>
                <div class="rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
                    {subscribe_box("contacto", "", '<p class="text-lg font-semibold text-ink-900">Recíbelo gratis</p><p class="mt-1 text-[15px] text-ink-700">Solo tu email. Lo abres al tiro, sin instalar nada.</p>')}
                </div>
            </div>
        </section>

        '''
    html = sub(r'<!-- 6\. Formulario -->.*?(?=<!-- 7\. FAQ -->)', contacto.replace("\\", "\\\\"), html)

    # Cierre: el texto habla del checklist, no de instalar.
    html = sub(r'(<!-- 8\. Cierre -->.*?<p class="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-white/80">)[^<]*(</p>)',
               r"\g<1>Empieza por el checklist: en 15 minutos sabes si tu tienda está lista.\g<2>", html)

    # El resto de los botones de instalar llevan al formulario del hero.
    labels = {"header": "Checklist gratis", "pricing": "Recibir el checklist gratis", "final": "Recibir el checklist gratis"}

    def cta(m):
        loc, cls = m.group(1), m.group(2)
        return f'<a href="#suscribir" data-track="subscribe_cta" data-loc="{loc}" class="{cls}">{labels[loc]}</a>'

    html = sub(r'<a href="https://apps\.shopify\.com/productsentinel" target="_blank" rel="noopener" data-track="install_click" data-loc="(header|pricing|final)" class="([^"]*)">.*?</a>',
               cta, html, count=3)
    if "apps.shopify.com" in html:
        sys.exit(f"ab-lista: quedó un enlace de instalar en {slug}/guia")
    return html


def main():
    for slug in EVENTS:
        out = ROOT / slug / "guia" / "index.html"
        out.parent.mkdir(exist_ok=True)
        out.write_text(build(slug))
        print(f"ok  {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
