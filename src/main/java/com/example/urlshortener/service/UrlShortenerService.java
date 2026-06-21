package com.example.urlshortener.service;

import com.example.urlshortener.entity.Click;
import com.example.urlshortener.entity.Url;
import com.example.urlshortener.repository.ClickRepository;
import com.example.urlshortener.repository.UrlRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class UrlShortenerService {

    private final UrlRepository urlRepository;
    private final ClickRepository clickRepository;

    public UrlShortenerService(
            UrlRepository urlRepository,
            ClickRepository clickRepository) {
        this.urlRepository = urlRepository;
        this.clickRepository = clickRepository;
    }

    private static final String BASE62_ALPHABET =
            "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    private static final int SHORT_CODE_LENGTH = 7;

    private final Random random = new Random();

    @Transactional
    public String shortenUrl(String originalUrl) {

        String shortCode;

        do {
            shortCode = generateBase62Code(SHORT_CODE_LENGTH);
        } while (urlRepository.existsByShortCode(shortCode));

        Url url = new Url();
        url.setOriginalUrl(originalUrl);
        url.setShortCode(shortCode);
        url.setCreatedBy("system");

        urlRepository.save(url);

        return shortCode;
    }

    private String generateBase62Code(int length) {

        StringBuilder sb = new StringBuilder(length);

        for (int i = 0; i < length; i++) {
            sb.append(
                    BASE62_ALPHABET.charAt(
                            random.nextInt(BASE62_ALPHABET.length())
                    )
            );
        }

        return sb.toString();
    }

    @Transactional
    public Optional<Url> getOriginalUrlAndRecordClick(
            String shortCode,
            String referrer) {

        Optional<Url> urlOpt = urlRepository.findByShortCode(shortCode);

        if (urlOpt.isPresent()) {

            Url url = urlOpt.get();

            Click click = new Click();
            click.setUrl(url);
            click.setClickedAt(LocalDateTime.now());
            click.setReferrer(referrer);

            clickRepository.save(click);
        }

        return urlOpt;
    }
}