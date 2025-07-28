{{- define "nestcms.name" -}}
nestcms
{{- end -}}

{{- define "nestcms.fullname" -}}
{{ include "nestcms.name" . }}
{{- end -}}