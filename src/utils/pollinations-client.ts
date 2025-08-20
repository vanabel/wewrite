/**
 * Pollinations.ai client for generating banner images
 * Uses the Pollinations.ai API to generate images based on keywords
 */

import { Notice, requestUrl } from "obsidian";
import { $t } from "src/lang/i18n";

export class PollinationsClient {
    private static instance: PollinationsClient;
    private baseUrl: string = "https://image.pollinations.ai";

    private constructor() {}

    public static getInstance(): PollinationsClient {
        if (!PollinationsClient.instance) {
            PollinationsClient.instance = new PollinationsClient();
        }
        return PollinationsClient.instance;
    }

    /**
     * Generate a banner image using Pollinations.ai
     * @param keywords - Keywords to generate image from (will be translated to English)
     * @param size - Image size in format "width*height" (default: "1440*613")
     * @returns Promise<string> - URL of the generated image
     */
    public async generateBannerImage(
        keywords: string,
        size: string = "1440*613"
    ): Promise<string> {
        try {
            // Clean and format keywords for URL
            const cleanKeywords = this.cleanKeywords(keywords);
            
            // Construct the Pollinations.ai URL
            const imageUrl = `${this.baseUrl}/${size}/${cleanKeywords}`;
            
            // Test if the image is accessible
            const response = await requestUrl({
                url: imageUrl,
                method: "HEAD"
            });

            if (response.status === 200) {
                return imageUrl;
            } else {
                throw new Error(`Failed to generate image: ${response.status}`);
            }
        } catch (error) {
            console.error("Error generating Pollinations.ai image:", error);
            new Notice($t("utils.pollinations-image-generation-failed") || "Failed to generate image");
            throw error;
        }
    }

    /**
     * Clean and format keywords for URL usage
     * @param keywords - Raw keywords string
     * @returns string - Cleaned keywords for URL
     */
    private cleanKeywords(keywords: string): string {
        return keywords
            .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
            .trim()
            .toLowerCase();
    }

    /**
     * Generate a banner image with translated keywords
     * @param keywords - Chinese keywords
     * @param size - Image size
     * @returns Promise<string> - URL of the generated image
     */
    public async generateBannerImageWithTranslation(
        keywords: string,
        size: string = "1440*613"
    ): Promise<string> {
        // For now, we'll use the original keywords
        // In the future, this could integrate with the translation service
        return this.generateBannerImage(keywords, size);
    }
}
