/* RICHIES Admission Consultants — Ultra-Optimized, High-Performance Frontend */
(() => {
  'use strict';

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
  const prefersLessMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================================
     1. HIGH-PERFORMANCE SCROLL PIPELINE (Zero-reflow GPU scaleX)
     ========================================================================== */
  const scrollProgress = $('#scrollProgress');
  const siteHeader = $('#siteHeader');
  const backToTop = $('#backToTop');

  let cachedScrollable = 1;
  let ticking = false;

  function recalculateScrollMetrics() {
    cachedScrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  function onScrollTick() {
    const scrollY = window.scrollY || window.pageYOffset;

    // GPU-composited scaleX avoids browser reflow
    if (scrollProgress) {
      const progress = Math.min(1, Math.max(0, scrollY / cachedScrollable));
      scrollProgress.style.transform = `scaleX(${progress})`;
    }

    // Header state
    if (siteHeader) {
      siteHeader.classList.toggle('is-scrolled', scrollY > 20);
    }

    // Back to top floating button
    if (backToTop) {
      backToTop.classList.toggle('is-visible', scrollY > 450);
    }

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScrollTick);
    }
  }, { passive: true });

  window.addEventListener('resize', recalculateScrollMetrics, { passive: true });
  window.addEventListener('load', () => {
    recalculateScrollMetrics();
    onScrollTick();
  });

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: prefersLessMotion ? 'auto' : 'smooth'
      });
    });
  }

  /* ==========================================================================
     2. STAGGERED HARDWARE-ACCELERATED REVEAL OBSERVER
     ========================================================================== */
  const revealElements = $$('.reveal');
  if ('IntersectionObserver' in window && !prefersLessMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px 40px 0px'
    });

    revealElements.forEach((el, index) => {
      // Apply subtle stagger if element is a sibling in a grid
      const parent = el.parentElement;
      if (parent && (parent.classList.contains('courses-grid') || 
                     parent.classList.contains('services-grid') || 
                     parent.classList.contains('leadership-grid') || 
                     parent.classList.contains('journey-steps'))) {
        const siblingIndex = Array.from(parent.children).indexOf(el);
        el.style.setProperty('--stagger', `${siblingIndex % 6}`);
      }
      observer.observe(el);
    });
  } else {
    revealElements.forEach(item => item.classList.add('visible'));
  }

  /* ==========================================================================
     3. SILKY SMOOTH ACCORDION (FAQ)
     ========================================================================== */
  const faqItems = $$('.faq-item');
  faqItems.forEach(item => {
    const summary = item.querySelector('summary');
    const content = item.querySelector('p');
    if (!summary || !content) return;

    summary.addEventListener('click', (event) => {
      event.preventDefault();

      const isOpen = item.hasAttribute('open');

      if (isOpen) {
        // Smoothly close
        content.style.maxHeight = `${content.scrollHeight}px`;
        content.style.opacity = '1';
        
        requestAnimationFrame(() => {
          content.style.transition = prefersLessMotion 
            ? 'none' 
            : 'max-height 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease';
          content.style.maxHeight = '0px';
          content.style.opacity = '0';
        });

        const onTransitionEnd = () => {
          item.removeAttribute('open');
          content.style.maxHeight = '';
          content.style.opacity = '';
          content.style.transition = '';
          content.removeEventListener('transitionend', onTransitionEnd);
        };
        content.addEventListener('transitionend', onTransitionEnd, { once: true });
        if (prefersLessMotion) onTransitionEnd();
      } else {
        // Smoothly open
        item.setAttribute('open', '');
        const targetHeight = content.scrollHeight;
        content.style.maxHeight = '0px';
        content.style.opacity = '0';

        requestAnimationFrame(() => {
          content.style.transition = prefersLessMotion 
            ? 'none' 
            : 'max-height 0.38s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.32s ease';
          content.style.maxHeight = `${targetHeight}px`;
          content.style.opacity = '1';
        });

        const onTransitionEnd = () => {
          content.style.maxHeight = '';
          content.style.opacity = '';
          content.style.transition = '';
          content.removeEventListener('transitionend', onTransitionEnd);
        };
        content.addEventListener('transitionend', onTransitionEnd, { once: true });
        if (prefersLessMotion) onTransitionEnd();
      }
    });
  });

  /* ==========================================================================
     4. RESPONSIVE MOBILE NAVIGATION
     ========================================================================== */
  const menuToggle = $('#menuToggle');
  const navLinks = $('#navLinks');

  if (menuToggle && navLinks) {
    function closeMenu() {
      navLinks.classList.remove('open');
      menuToggle.classList.remove('is-active');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    function openMenu() {
      navLinks.classList.add('open');
      menuToggle.classList.add('is-active');
      menuToggle.setAttribute('aria-expanded', 'true');
    }

    menuToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.contains('open');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    $$('#navLinks a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && navLinks.classList.contains('open')) {
        closeMenu();
      }
    });
  }

  /* ==========================================================================
     5. SMOOTH INTERACTIVE COURSE FILTERING
     ========================================================================== */
  const courseCards = $$('.course-card');
  const courseCount = $('#courseCount');
  const filters = $$('.filter-button');

  filters.forEach(button => {
    button.addEventListener('click', () => {
      const selected = button.dataset.filter;

      filters.forEach(item => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });

      let count = 0;
      courseCards.forEach((card, idx) => {
        const matches = selected === 'All programmes' || card.dataset.category === selected;
        
        if (matches) {
          card.hidden = false;
          count++;
          if (!prefersLessMotion) {
            card.style.animation = 'none';
            void card.offsetHeight; // trigger reflow
            card.style.animation = `fadeScaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) ${Math.min(idx * 0.03, 0.2)}s both`;
          }
        } else {
          card.hidden = true;
        }
      });

      if (courseCount) {
        courseCount.textContent = `${count} ${count === 1 ? 'pathway' : 'pathways'} to explore`;
      }
      
      recalculateScrollMetrics();
    });
  });

  /* Course selector jump with auto-focus */
  const courseSelector = $('#course');
  $$('[data-select-course]').forEach(button => {
    button.addEventListener('click', () => {
      if (courseSelector) {
        courseSelector.value = button.dataset.selectCourse;
      }
      const destination = $('#consultation');
      if (destination) {
        destination.scrollIntoView({
          behavior: prefersLessMotion ? 'auto' : 'smooth',
          block: 'start'
        });
      }
      setTimeout(() => {
        if (courseSelector) {
          courseSelector.focus({ preventScroll: true });
          courseSelector.parentElement?.classList.add('highlight-pulse');
          setTimeout(() => {
            courseSelector.parentElement?.classList.remove('highlight-pulse');
          }, 1200);
        }
      }, prefersLessMotion ? 50 : 650);
    });
  });

  /* ==========================================================================
     6. FLOATING WHATSAPP ADVISOR QUICK CHAT
     ========================================================================== */
  const waToggle = $('#waToggle');
  const waOptions = $('#waOptions');

  if (waToggle && waOptions) {
    function toggleWaOptions() {
      const isHidden = waOptions.hidden;
      waOptions.hidden = !isHidden;
      waToggle.setAttribute('aria-expanded', String(isHidden));
      if (isHidden) {
        waOptions.classList.add('is-open');
      } else {
        waOptions.classList.remove('is-open');
      }
    }

    waToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWaOptions();
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.wa-float') && !waOptions.hidden) {
        waOptions.hidden = true;
        waOptions.classList.remove('is-open');
        waToggle.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !waOptions.hidden) {
        waOptions.hidden = true;
        waOptions.classList.remove('is-open');
        waToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ==========================================================================
     7. INQUIRY FORM ROUTING (WHATSAPP & SECURE EMAIL)
     ========================================================================== */
  const form = $('#admissionForm');
  const status = $('#formStatus');
  const waButton = $('#sendWhatsApp');
  const emailButton = $('#sendEmail');

  const mobileNumbers = {
    'Gagandeep Singh': '916280298697',
    'Abhishek Chouhan': '917980153933'
  };
  const officialEmail = 'richiesmilo21@gmail.com';

  const formField = id => document.getElementById(id)?.value.trim() || '';

  function setStatus(message, isError = false) {
    if (!status) return;
    status.hidden = false;
    status.classList.toggle('error', isError);
    status.innerHTML = message;
    status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function setBusy(isBusy) {
    [waButton, emailButton].forEach(btn => {
      if (btn) btn.disabled = isBusy;
    });
    if (emailButton) {
      emailButton.innerHTML = isBusy 
        ? '<span class="spinner" aria-hidden="true"></span> Submitting your enquiry…' 
        : 'Send directly to email <span aria-hidden="true">↗</span>';
    }
  }

  function collectDetails() {
    return {
      name: formField('studentName'),
      phone: formField('studentPhone'),
      email: formField('studentEmail'),
      qualification: formField('qualification'),
      intake: formField('intake'),
      course: formField('course'),
      preferred_location: formField('location'),
      annual_budget: formField('budget'),
      preferred_consultant: formField('advisor'),
      message: formField('message')
    };
  }

  function makeMessage(details) {
    return [
      'Hello RICHIES Admission Consultants,',
      'I would like a private admission consultation.',
      '',
      `• Name: ${details.name}`,
      `• WhatsApp / Phone: ${details.phone}`,
      `• Email: ${details.email || 'Not supplied'}`,
      `• Current Qualification: ${details.qualification}`,
      `• Preferred Course: ${details.course}`,
      `• Preferred Intake: ${details.intake || 'Not specified'}`,
      `• Preferred Location: ${details.preferred_location || 'Open to options'}`,
      `• Annual Education Budget: ${details.annual_budget || 'To be discussed privately'}`,
      `• Preferred Consultant: ${details.preferred_consultant}`,
      `• Additional Notes: ${details.message || 'None supplied'}`,
      '',
      'I consent to being contacted regarding this admission enquiry.'
    ].join('\n');
  }

  function makeFallbackMailto(details) {
    const body = makeMessage(details);
    const subject = `RICHIES — Private Admission Enquiry (${details.name} - ${details.course})`;
    return `mailto:${officialEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function emailFailure(details) {
    setStatus(`
      The automatic email service encountered an error or needs activation. Your details are safe:
      <div style="margin-top:10px;">
        <a href="${makeFallbackMailto(details)}" class="button button-gold" style="padding:10px 16px;display:inline-flex;font-size:11px;">
          Open Pre-filled Email Draft ↗
        </a>
      </div>
    `, true);
  }

  async function sendByEmail(details) {
    setBusy(true);
    setStatus('Submitting your enquiry securely to the official mailbox…');

    const fields = Object.fromEntries(new FormData(form).entries());
    const payload = {
      ...fields,
      ...details,
      _subject: `New RICHIES Admission Enquiry — ${details.name} (${details.course})`,
      _template: 'table',
      _captcha: 'false',
      _replyto: details.email || '',
      source: 'RICHIES Premium Website'
    };

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${officialEmail}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Email service response error');
      const data = await response.json();
      if (data.success === false || data.success === 'false') {
        throw new Error('Service declined request');
      }

      setStatus(`
        <strong>✓ Enquiry submitted successfully!</strong><br>
        Your enquiry has been dispatched to <strong>${officialEmail}</strong>. Gagandeep Singh or Abhishek Chouhan will reach out to you directly.
      `);
      form.reset();
    } catch (error) {
      emailFailure(details);
    } finally {
      setBusy(false);
    }
  }

  if (form) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      if (formField('website')) return; // Honeypot spam protection

      const details = collectDetails();
      const mode = event.submitter?.dataset.submitMode || 'whatsapp';

      if (mode === 'email') {
        void sendByEmail(details);
        return;
      }

      // WhatsApp submission
      const recipient = mobileNumbers[details.preferred_consultant] || mobileNumbers['Abhishek Chouhan'];
      const url = `https://wa.me/${recipient}?text=${encodeURIComponent(makeMessage(details))}`;

      setStatus(`
        <strong>Opening WhatsApp with your complete enquiry…</strong><br>
        Please tap <strong>Send</strong> in WhatsApp to deliver your request directly to ${details.preferred_consultant}.
      `);

      const tab = window.open(url, '_blank', 'noopener,noreferrer');
      if (tab) {
        tab.opener = null;
      } else {
        window.location.assign(url);
      }
    });
  }

  /* Footer dynamic copyright year */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
