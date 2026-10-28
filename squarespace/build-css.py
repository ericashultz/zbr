#!/usr/bin/env python3
"""Writes zbr-custom.min.css: zbr-custom.css without comments and extra whitespace.
Squarespace's Custom CSS box silently drops whatever goes past its size limit, so paste the .min.css file there.
Edit zbr-custom.css (the readable source); re-run this after every change."""
import re, pathlib
here = pathlib.Path(__file__).parent
src = (here / 'zbr-custom.css').read_text()
out, i, n = [], 0, len(src)
while i < n:                       # copy strings and url(...) untouched, drop /* comments */
    c = src[i]
    if c in '"\'':
        j = i + 1
        while j < n and src[j] != c:
            j += 2 if src[j] == '\\' else 1
        out.append(src[i:j + 1]); i = j + 1
    elif src.startswith('/*', i):
        j = src.find('*/', i + 2)
        i = n if j < 0 else j + 2
        out.append(' ')
    else:
        out.append(c); i += 1
css = ''.join(out)
# collapse whitespace outside strings
parts = re.split(r'("(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\')', css)
for k in range(0, len(parts), 2):
    p = re.sub(r'\s+', ' ', parts[k])
    p = re.sub(r' ?([{};]) ?', r'\1', p)
    p = re.sub(r';}', '}', p)
    parts[k] = p
css = ''.join(parts).strip() + '\n'
# the pixel-font stack is written ~80 times: keep it once, as a variable (saves ~2.8 KB of the Custom CSS box's size limit)
STACK = '"Fixedsys Excelsior","Courier New",monospace'
css = css.replace(STACK, 'var(--zpx)')
decl = 'html{--zpx:' + STACK + '}'
if css.startswith('@import'):          # an @import has to stay first
    k = css.index(';') + 1
    css = css[:k] + decl + css[k:]
else:
    css = decl + css

# Drop declarations that a later rule with exactly the same selector overrides (same property, same or higher importance): they can never win.
def _split_top(c):
    rules, depth, start, i, n = [], 0, 0, 0, len(c)
    while i < n:
        ch = c[i]
        if ch in '"\'':
            q = ch; i += 1
            while i < n and c[i] != q:
                i += 2 if c[i] == '\\' else 1
        elif ch == '{': depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0: rules.append(c[start:i + 1]); start = i + 1
        i += 1
    if c[start:].strip(): rules.append(c[start:])
    return rules
def _split_decls(body):
    out, cur, depth, i, n = [], '', 0, 0, len(body)
    while i < n:
        ch = body[i]
        if ch in '"\'':
            q = ch; cur += ch; i += 1
            while i < n and body[i] != q:
                if body[i] == '\\': cur += body[i]; i += 1
                cur += body[i]; i += 1
            cur += body[i] if i < n else ''; i += 1; continue
        if ch == '(': depth += 1
        elif ch == ')': depth -= 1
        if ch == ';' and depth == 0:
            if cur.strip(): out.append(cur.strip())
            cur = ''
        else: cur += ch
        i += 1
    if cur.strip(): out.append(cur.strip())
    return out
_rules = _split_top(css)
_parsed = []
for r in _rules:
    if r.startswith('@') or '{' not in r: _parsed.append(None); continue
    sel, body = r.split('{', 1)
    _parsed.append((sel.strip(), _split_decls(body[:-1])))
_prop = lambda d: d.split(':', 1)[0].strip().lower()
_imp = lambda d: '!important' in d.replace(' ', '')
_seen, _out, _dead = {}, [], 0
for idx in range(len(_rules) - 1, -1, -1):
    p_ = _parsed[idx]
    if p_ is None: _out.append(_rules[idx]); continue
    sel, decls = p_
    keep = []
    for d in decls:
        key = (sel, _prop(d))
        later = _seen.get(key)
        if later is not None and later >= _imp(d): _dead += 1; continue
        keep.append(d)
        _seen[key] = max(_seen.get(key, False), _imp(d))
    _out.append(sel + '{' + ';'.join(keep) + '}' if keep else '')
css = ''.join(reversed(_out)).strip() + '\n'
print(_dead, 'overridden declarations dropped')
(here / 'zbr-custom.min.css').write_text(css)
print(len(src.encode()), '->', len(css.encode()), 'bytes')
