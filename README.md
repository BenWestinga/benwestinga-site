# Ben Westinga Site & Games

Welkom bij de repository van Ben Westinga. Dit project bevat een persoonlijke website en spellen, waaronder "The Dawn of Remmers".

## Web Deploy (Pygbag voor The Dawn of Remmers)

De game "The Dawn of Remmers" is volledig compatibel gemaakt met Pygbag, wat betekent dat het via WebAssembly in de browser kan draaien.

### Lokaal bouwen

1. Zorg dat je Python geïnstalleerd hebt.
2. Open een terminal/PowerShell in deze map.
3. Installeer de vereisten: `pip install -r requirements.txt`
4. Voer het build script uit:
   - Op Windows: `.\scripts\build_web.ps1`
   - Op Linux/Mac: `bash scripts/build_web.sh`
5. Het script plaatst de speelbare webversie in de map `docs/the-dawn-of-remmers/`.
6. Om lokaal te testen, kun je in die map een webserver starten:
   `python -m http.server`

### GitHub Pages aanzetten

Als je deze repository naar GitHub pusht, kun je de game eenvoudig live zetten via GitHub Pages:

1. Ga op GitHub naar je repository **Settings**.
2. Klik aan de linkerkant op **Pages**.
3. Onder **Build and deployment**, kies je voor **Deploy from a branch**.
4. Selecteer je `main` branch en kies de map `/docs`.
5. Klik op **Save**.

### Welke URL moet ik gebruiken?

Als je GitHub Pages hebt ingesteld, zal je website te bereiken zijn op (bijvoorbeeld):
`https://[jouw-github-naam].github.io/benwestinga-site/`

Je kunt The Dawn of Remmers dan openen door daarachter te zetten:
`https://[jouw-github-naam].github.io/benwestinga-site/docs/the-dawn-of-remmers/`
(of via de knop op de index.html pagina die we hebben geüpdatet).
