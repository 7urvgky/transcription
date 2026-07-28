'use strict';
function markStateChanged() {
  debouncedSave();
}

function bindUIEvents() {
// 이벤트 리스너 바인딩
    document.getElementById('source-text').addEventListener('input', (e) => {
      AppState.sourceText = e.target.value;
      document.getElementById('char-counter').textContent = `${AppState.sourceText.length}자 입력됨`;
      
      if (AppState.sourceText.length > 3000 && !window.hasShownLengthWarning) {
        window.hasShownLengthWarning = true;
        showCustomAlert(
          '대용량 텍스트 안내',
          '원문이 3,000자를 초과했습니다. 원고지 페이지가 과도하게 늘어나면 실시간 렌더링이 다소 느려질 수 있으므로, 3,000자 이내로 나누어 제작하시는 것을 추천합니다.'
        );
      } else if (AppState.sourceText.length <= 3000) {
        window.hasShownLengthWarning = false;
      }
      
      debouncedRender();
      markStateChanged();
    });
    document.getElementById('input-title').addEventListener('input', (e) => {
      AppState.articleTitle = e.target.value;
      document.title = AppState.articleTitle ? AppState.articleTitle : "필사 용지 만들기";
      updateHeaderAndTitle();

      markStateChanged();
    });

    document.getElementById('grid-cols-select').addEventListener('change', (e) => {
      AppState.gridCols = e.target.value;
      markStateChanged();
      renderPages();
    });

    document.getElementById('hide-student-info').addEventListener('change', e => {
      AppState.hideStudentInfo = e.target.checked;
      markStateChanged();
      renderPages();
    });

    ['input-school', 'input-grade', 'input-name'].forEach(id => {
      document.getElementById(id).addEventListener('input', (e) => {
        const val = e.target.value;

        if (id === 'input-school') AppState.schoolName = val;
        if (id === 'input-grade') AppState.gradeInfo = val;
        if (id === 'input-name') AppState.studentName = val;

        updateHeaderAndTitle();

        markStateChanged();
      });
    });


    document.getElementById('pattern-guide').addEventListener('change', (e) => { AppState.patternGuide = e.target.checked; markStateChanged(); renderPages(); });
    document.getElementById('pattern-empty').addEventListener('change', (e) => { AppState.patternEmpty = e.target.checked; markStateChanged(); renderPages(); });
    document.getElementById('exclude-first-page').addEventListener('change', (e) => {
      AppState.excludeFirstPage = !e.target.checked;
      markStateChanged();
      renderPages();
    });
    document.getElementById('hide-manuscript-header').addEventListener('change', (e) => { AppState.hideManuscriptHeader = e.target.checked; markStateChanged(); renderPages(); });
    document.getElementById('hide-char-count').addEventListener('change', (e) => { AppState.hideCharCount = e.target.checked; markStateChanged(); renderPages(); });
    document.getElementById('hide-page-numbers').addEventListener('change', (e) => { AppState.hidePageNumbers = e.target.checked; markStateChanged(); renderPages(); });
    document.getElementById('hide-grid-guides').addEventListener('change', (e) => {
      AppState.hideGridGuides = e.target.checked;
      updateGridGuides();
      markStateChanged();
    });

        document.getElementById('zoom-input-field').addEventListener('input', (e) => {
      let num = parseInt(e.target.value);
      if (!isNaN(num)) {
        num = Math.max(30, Math.min(200, num));
        AppState.previewZoomValue = num;
        AppState.previewZoomMode = 'manual';
        updateZoomModeUI();
        adjustPreviewScale();
      }
    });
}

function bindDocumentEvents() {
// 엔터키 줄바꿈 무효화
    document.addEventListener('keydown', (e) => {
      const target = e.target;
      if (target.hasAttribute('contenteditable')) {
        const isSingleLineField = 
          target.classList.contains('school-placeholder') ||
          target.classList.contains('grade-placeholder') ||
          target.classList.contains('name-placeholder') ||
          target.classList.contains('title-placeholder') ||
          target.classList.contains('mini-header-left') ||
          target.classList.contains('mini-header-center') ||
          target.classList.contains('footer-label-source') ||
          target.classList.contains('footer-label-guide') ||
          target.classList.contains('footer-label-empty');

        if (isSingleLineField && e.key === 'Enter') {
          e.preventDefault();
          target.blur(); 
        }
      }
    });

    // 지면 실시간 편집 내용 싱크
    document.addEventListener('input', (e) => {
      const target = e.target;
      if (!target.hasAttribute('contenteditable')) return;

      if (target.innerHTML === '<br>') {
        target.innerHTML = '';
      }

      const txt = target.textContent;

      if (target.classList.contains('school-placeholder')) {
        AppState.schoolName = txt === "" ? " " : txt;
        document.getElementById('input-school').value = AppState.schoolName === " " ? "" : AppState.schoolName;
        syncMetadata('school-placeholder', AppState.schoolName, target);
      }
      else if (target.classList.contains('grade-placeholder')) {
        AppState.gradeInfo = txt === "" ? " " : txt;
        document.getElementById('input-grade').value = AppState.gradeInfo === " " ? "" : AppState.gradeInfo;
        syncMetadata('grade-placeholder', AppState.gradeInfo, target);
      }
      else if (target.classList.contains('name-placeholder')) {
        AppState.studentName = txt;
        document.getElementById('input-name').value = AppState.studentName;
        syncMetadata('name-placeholder', AppState.studentName, target);
      }
      else if (target.classList.contains('title-placeholder')) {
        AppState.articleTitle = txt;
        document.getElementById('input-title').value = AppState.articleTitle;
        syncMetadata('title-placeholder', AppState.articleTitle, target);
        document.title = AppState.articleTitle ? AppState.articleTitle : "필사 용지 만들기";
        syncMetadata('mini-header-center', AppState.articleTitle, null);
      }
      else if (target.classList.contains('mini-header-left')) {
        AppState.headerLeftText = txt;
        syncMetadata('mini-header-left', AppState.headerLeftText, target);
      }
      else if (target.classList.contains('mini-header-center')) {
        AppState.articleTitle = txt;
        document.getElementById('input-title').value = AppState.articleTitle;
        syncMetadata('mini-header-center', AppState.articleTitle, target);
        syncMetadata('title-placeholder', AppState.articleTitle, null);
        document.title = AppState.articleTitle ? AppState.articleTitle : "필사 용지 만들기";
      }
      else if (target.classList.contains('footer-label-source')) {
        AppState.customFooterSourceText = txt === "" ? null : txt;
        syncMetadata('footer-label-source', txt, target);
      }
      else if (target.classList.contains('footer-label-guide')) {
        AppState.customFooterGuideText = txt === "" ? null : txt;
        syncMetadata('footer-label-guide', txt, target);
      }
      else if (target.classList.contains('footer-label-empty')) {
        AppState.customFooterEmptyText = txt === "" ? null : txt;
        syncMetadata('footer-label-empty', txt, target);
      }

      debouncedSave();
    });

    // 클립보드 붙여넣기 퓨어텍스트 치환 안전 가드
    document.addEventListener('paste', (e) => {
      const target = e.target;
      const isTargetEditable = target.hasAttribute('contenteditable') || target.id === 'source-text';
      if (!isTargetEditable) return;

      e.preventDefault();
      let text = (e.clipboardData || window.clipboardData).getData('text/plain');
      text = text.replace(/\r\n/g, '\n');
      
      if (target.id === 'source-text') {
        text = text.replace(/\n{3,}/g, '\n\n');
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const currentVal = target.value;
        target.value = currentVal.substring(0, start) + text + currentVal.substring(end);
        target.selectionStart = target.selectionEnd = start + text.length;
        target.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        text = text.replace(/\n/g, ' ');
        
        const selection = window.getSelection();
        if (selection.rangeCount) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(text);
          range.insertNode(textNode);
          
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          selection.removeAllRanges();
          selection.addRange(range);
        } else if (document.queryCommandSupported('insertText')) {
          document.execCommand('insertText', false, text);
        }
        target.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    document.addEventListener('blur', (e) => {
      const target = e.target;
      if (!target.hasAttribute('contenteditable')) return;

      if (target.textContent.trim() === "") {
        target.innerHTML = "";
      }

      if (target.classList.contains('title-placeholder') || target.classList.contains('mini-header-center')) {
        updateHeaderAndTitle();
      }
    }, true);
}

function bindWindowEvents() {

// Ctrl+P / Cmd+P 바인딩
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
      }
    });

    window.addEventListener('resize', () => {
      if (resizeTimeout) {
        window.cancelAnimationFrame(resizeTimeout);
      }
      resizeTimeout = window.requestAnimationFrame(() => {
        adjustPreviewScale();
      });
    });

    window.addEventListener('load', () => {
      cachePageDimensions();
      adjustPreviewScale();
    });
}

function initializeControllers() {
  
  bindUIEvents();
  bindDocumentEvents();
  bindWindowEvents();
}