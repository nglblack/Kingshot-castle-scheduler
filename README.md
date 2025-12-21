# Kingshot Castle Battle Scheduler

## Project Structure

```
project/
├── index.html              # Main HTML file
├── README.md              # This file
└── assets/
    ├── css/
    │   └── styles.css     # All stylesheets
    ├── js/
    │   └── script.js      # All JavaScript
    ├── images/            # Future: Images, icons, logos
    ├── fonts/             # Future: Custom fonts
    └── data/              # Future: JSON files, datasets
```

## Folder Purpose

- **`assets/css/`** - All CSS stylesheets
- **`assets/js/`** - All JavaScript files
- **`assets/images/`** - Images, icons, graphics, screenshots
- **`assets/fonts/`** - Custom web fonts
- **`assets/data/`** - JSON files, static data, configurations

## Adding New Files

### CSS Files
Add new stylesheets to `assets/css/` and link them in `index.html`:
```html
<link rel="stylesheet" href="assets/css/newfile.css">
```

### JavaScript Files
Add new scripts to `assets/js/` and include them in `index.html`:
```html
<script src="assets/js/newfile.js"></script>
```

### Images
Add images to `assets/images/` and reference them:
```html
<img src="assets/images/logo.png" alt="Logo">
```
Or in CSS:
```css
background-image: url('../images/background.jpg');
```

## External Dependencies

Currently using CDN for:
- LZ-String (compression library)
- html2canvas (screenshot functionality)

## Notes

- Keep the folder structure consistent as you scale
- All asset paths are relative to `index.html`
- This structure works well with version control (Git)
- Easy to deploy to any web server
