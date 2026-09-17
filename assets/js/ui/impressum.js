import { KONFIGURATION } from '../config.js';

// Die Anbieterkennzeichnung wird ausschliesslich aus der Konfiguration gefuellt.
// Fehlen die Angaben, wird hier kein Ersatztext und keine erfundene Angabe erzeugt.
const ziel = document.getElementById('impressum-inhalt');
const b = KONFIGURATION.betreiber;

function absatz(text) {
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

function zeile(bezeichnung, wert) {
  const tr = document.createElement('tr');
  const th = document.createElement('th');
  th.scope = 'row';
  th.textContent = bezeichnung;
  const td = document.createElement('td');
  td.textContent = wert;
  tr.append(th, td);
  return tr;
}

if (b.vorhanden && b.name && b.anschrift && b.email) {
  const tabelle = document.createElement('table');
  const tbody = document.createElement('tbody');
  tbody.appendChild(zeile('Anbieter', b.name));
  tbody.appendChild(zeile('Anschrift', b.anschrift));
  tbody.appendChild(zeile('Kontakt', b.email));
  if (b.inhaltlichVerantwortlich) {
    tbody.appendChild(zeile('Inhaltlich verantwortlich', b.inhaltlichVerantwortlich));
  }
  tabelle.appendChild(tbody);
  ziel.appendChild(tabelle);
} else {
  const box = document.createElement('div');
  box.className = 'hinweis hinweis--warnung';
  box.setAttribute('role', 'note');

  const titel = document.createElement('p');
  titel.className = 'hinweis__titel';
  titel.textContent = 'Die gesetzlich vorgeschriebenen Anbieterangaben liegen noch nicht vor.';

  box.appendChild(titel);
  box.appendChild(
    absatz(
      'Für eine öffentliche Veröffentlichung sind nach § 5 Digitale-Dienste-Gesetz mindestens der vollständige Name, eine Zustellanschrift und eine Kontaktmöglichkeit zur schnellen elektronischen Kontaktaufnahme erforderlich.',
    ),
  );
  box.appendChild(
    absatz(
      'Diese Angaben werden hier bewusst nicht erfunden und nicht durch Platzhalter ersetzt. Solange sie fehlen, ist die Seite nicht öffentlich freigeschaltet.',
    ),
  );
  box.appendChild(
    absatz(
      'Sobald die Angaben vorliegen, werden sie an genau einer Stelle eingetragen und erscheinen dann automatisch an dieser Stelle.',
    ),
  );
  ziel.appendChild(box);
}
