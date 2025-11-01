% Minimal stand-in for the Springer svjour3 class.
\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{svjour3}[2024/06/04 Minimal Springer-inspired class]

\DeclareOption*{\PassOptionsToClass{\CurrentOption}{article}}
\ProcessOptions\relax

\LoadClass[11pt]{article}

\RequirePackage{amsmath}
\RequirePackage{geometry}
\geometry{margin=1in}

\RequirePackage{titlesec}
\titleformat{\section}{\normalfont\large\bfseries}{\thesection}{1em}{}
\titleformat{\subsection}{\normalfont\normalsize\bfseries}{\thesubsection}{1em}{}

\makeatletter
\newcommand{\@journalname}{}
\newcommand{\journalname}[1]{\gdef\@journalname{#1}}
\newcommand{\@subtitle}{}
\newcommand{\subtitle}[1]{\gdef\@subtitle{#1}}
\newcommand{\@titlerunning}{}
\newcommand{\titlerunning}[1]{\gdef\@titlerunning{#1}}
\newcommand{\@authorrunning}{}
\newcommand{\authorrunning}[1]{\gdef\@authorrunning{#1}}
\newcommand{\@communicated}{}
\newcommand{\communicatedby}[1]{\gdef\@communicated{Communicated by\ #1}}
\newcommand{\@dedicatory}{}
\newcommand{\dedication}[1]{\gdef\@dedicatory{#1}}
\newcommand{\@institute}{}
\newcommand{\institute}[1]{\gdef\@institute{#1}}
\newcommand{\inst}[1]{\textsuperscript{#1}}
\newcommand{\thankstext}[2]{\g@addto@macro\@thanks{\par\noindent\textbf{#1} #2\par}}
\providecommand{\email}[1]{\texttt{#1}}

\newcommand{\keywords}[1]{\par\addvspace{0.5\baselineskip}\noindent\textbf{Keywords} #1\par}
\newcommand{\subclass}[1]{\par\addvspace{0.5\baselineskip}\noindent\textbf{Mathematics Subject Classification} #1\par}
\newcommand{\PACS}[1]{\par\addvspace{0.5\baselineskip}\noindent\textbf{PACS} #1\par}

\providecommand{\smartqed}{\qed}
\providecommand{\qedhere}{\tag*{$\square$}}

\renewcommand{\maketitle}{%
  \begin{center}%
    {\LARGE\bfseries \@title\par}\vspace{0.5\baselineskip}%
    \ifx\@subtitle\@empty\else
      {\large\itshape \@subtitle\par}\vspace{0.5\baselineskip}%
    \fi
    {\large \@author\par}\vspace{0.5\baselineskip}%
    \ifx\@institute\@empty\else
      {\normalsize \@institute\par}\vspace{0.5\baselineskip}%
    \fi
    \ifx\@journalname\@empty\else
      {\normalsize\textit{\@journalname}\par}\vspace{0.5\baselineskip}%
    \fi
    \ifx\@communicated\@empty\else
      {\footnotesize \@communicated\par}\vspace{0.5\baselineskip}%
    \fi
    \ifx\@dedicatory\@empty\else
      {\footnotesize\itshape \@dedicatory\par}\vspace{0.5\baselineskip}%
    \fi
  \end{center}%
  \let\thanks\@gobble
  \@thanks
  \setcounter{footnote}{0}%
  \global\let\@thanks\@empty
}

\renewenvironment{abstract}{%
  \small
  \begin{center}
    {\bfseries \abstractname}\par\vspace{0.5\baselineskip}
  \end{center}
  \list{}{\labelwidth=0pt\leftmargin=0pt\rightmargin=0pt}
  \item[]
}{%
  \endlist
  \normalsize
}

\makeatother

\endinput
