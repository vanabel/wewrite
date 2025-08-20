# New Features: Frontmatter Integration and Banner Generation

## Overview

This update adds two major features to the WeWrite Obsidian plugin:

1. **Enhanced Frontmatter Support**: The plugin now reads and displays additional frontmatter fields
2. **AI-Powered Banner Generation**: Generate banner images using Pollinations.ai based on keywords

## New Frontmatter Fields

The plugin now supports these additional frontmatter fields:

```yaml
---
author: Van Abel
banner_path: ./assets/banner.png
abstract: Article abstract text
keywords: 微分结构论、奇异空间、辛几何
---
```

### Field Descriptions

- **`author`**: Article author name
- **`banner_path`**: Path to the banner image (local or remote)
- **`abstract`**: Article abstract/summary
- **`keywords`**: Comma-separated keywords for the article

## Banner Generation Feature

### How It Works

1. **Set Keywords**: Add keywords to your markdown frontmatter
2. **Generate Banner**: Click the AI button next to the banner path field
3. **AI Processing**: The plugin translates Chinese keywords to English (optional)
4. **Image Generation**: Uses Pollinations.ai to create banner images
5. **Automatic Save**: Generated images are saved locally and paths updated

### Features

- **Keyword Translation**: Automatically translates Chinese keywords to English for better AI image generation
- **Customizable Size**: Supports custom image dimensions (default: 1440x613)
- **Local Storage**: Generated images are saved to your vault
- **Frontmatter Sync**: Banner paths are automatically updated in frontmatter

### Usage Example

1. Create a markdown file with frontmatter:
   ```markdown
   ---
   author: Van Abel
   keywords: 微分结构论、奇异空间、辛几何
   ---
   
   # Your Article Title
   ```

2. Open the WeWrite preview panel
3. In the article header section, you'll see new fields for banner path and keywords
4. Click the AI button next to banner path to generate a banner from keywords
5. The generated image will be saved and the banner_path updated automatically

## Technical Implementation

### New Files Created

- `src/utils/pollinations-client.ts` - Pollinations.ai API client
- `src/modals/keyword-banner-modal.ts` - Banner generation modal
- Enhanced `src/views/mp-article-header.ts` - New UI fields
- Enhanced `src/utils/ai-client.ts` - Banner generation methods

### Enhanced Files

- `src/utils/frontmatter.ts` - Better frontmatter handling
- `src/lang/locales/en-us.json` - English translations
- `src/lang/locales/zh-cn.json` - Chinese translations
- `styles.css` - Modal styling

### API Integration

- **Pollinations.ai**: Free AI image generation service
- **Translation**: Uses existing AI translation capabilities
- **Image Storage**: Integrates with existing resource management

## Configuration

No additional configuration is required. The feature works with existing AI account settings.

## Testing

1. **Install Dependencies**: Run `yarn install` or `npm install`
2. **Build Plugin**: Run `yarn build` or `npm run build`
3. **Test in Obsidian**: Load the plugin and test with the provided `test-frontmatter.md` file

## Benefits

- **Streamlined Workflow**: Generate banners directly from article content
- **Multilingual Support**: Automatic translation for better AI results
- **Consistent Branding**: Standardized banner generation process
- **Time Saving**: No need to manually create or find banner images
- **Integration**: Seamlessly works with existing WeWrite functionality

## Future Enhancements

- **Style Presets**: Predefined banner styles and themes
- **Batch Generation**: Generate multiple banner variations
- **Custom Prompts**: Advanced prompt engineering for specific use cases
- **Quality Settings**: Adjustable image generation parameters

## Support

For issues or questions about the new features, please refer to the main WeWrite documentation or create an issue in the project repository.
